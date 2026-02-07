"""
Admin routes: permit dashboard, debug endpoints, geocode proxy.
"""
from datetime import datetime

from flask import Blueprint, render_template, request, redirect, flash, jsonify
from flask_login import login_required, current_user

from db import get_mongodb_db, ensure_mongoengine_user
from middleware import token_required

admin_bp = Blueprint('admin', __name__)


# ------------------------------------------------------------------
# Test endpoint (no auth required)
# ------------------------------------------------------------------
@admin_bp.route('/api/admin/test', methods=['GET'])
def admin_test():
    """Test endpoint to verify API is reachable"""
    return jsonify({'status': 'ok', 'message': 'Admin API is reachable'}), 200


# ------------------------------------------------------------------
# Permit verification dashboard API
# ------------------------------------------------------------------
@admin_bp.route('/api/admin/verifications', methods=['GET'])
@token_required
def get_verifications_api():
    """API endpoint to get all verification submissions"""
    try:
        db, _ = get_mongodb_db(admin_bp)
        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500
        
        # Check if current user is admin by verifying in database
        user_email = request.user_email
        if not user_email:
            return jsonify({'error': 'User email not found in token'}), 401
        
        admin_user = db.users.find_one({'email': user_email, 'role': 'admin'})
        if not admin_user:
            return jsonify({'error': 'Admin access required'}), 403
        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500

        users_col = db.users
        all_users = list(users_col.find({'business_verification_ml': {'$exists': True, '$ne': None}}))

        verified_count = users_col.count_documents({'business_verification_ml': {'$exists': True, '$ne': None}, 'business_verification_status': 'verified'})
        rejected_count = users_col.count_documents({'business_verification_ml': {'$exists': True, '$ne': None}, 'business_verification_status': 'rejected'})

        verifications = []
        for u in all_users:
            ml = u.get('business_verification_ml', {})
            status = u.get('business_verification_status', 'rejected')
            verifications.append({
                'id': str(u.get('_id')),
                'farmer_name': f"{u.get('first_name', '')} {u.get('last_name', '')}".strip(),
                'farm_name': u.get('farm_name', 'N/A'),
                'email': u.get('email', 'N/A'),
                'status': status,
                'valid': ml.get('valid', False),
                'rejected': status == 'rejected',
                'confidence': ml.get('confidence', 0),
                'timestamp': ml.get('timestamp', 'N/A'),
                'extracted_text': ml.get('extracted_text', '')[:100],
                'quality_check': ml.get('quality_check', {}),
                'document_detection': ml.get('document_detection', {}),
                'permit_validation': ml.get('permit_validation', {}),
            })

        return jsonify({
            'verifications': verifications,
            'stats': {
                'total': len(all_users),
                'verified': verified_count,
                'rejected': rejected_count,
            }
        }), 200
    except Exception as e:
        print(f"Dashboard error: {e}")
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/api/user/verification-status', methods=['GET'])
@token_required
def get_user_verification_status():
    """Get current user's own verification status"""
    try:
        db, _ = get_mongodb_db(admin_bp)
        if db is None:
            return jsonify({'error': 'Database connection failed'}), 500

        user_email = request.user_email
        if not user_email:
            return jsonify({'error': 'User email not found in token'}), 401

        user = db.users.find_one({'email': user_email})
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Only return if user has submitted verification or is a farmer
        if not user.get('business_verification_submitted_at') and user.get('role') != 'farmer':
            return jsonify({
                'status': 'not_submitted',
                'message': 'No verification submission found'
            }), 200

        ml = user.get('business_verification_ml', {})
        
        return jsonify({
            'status': 'found',
            'verification': {
                'id': str(user.get('_id')),
                'farmer_name': f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
                'farm_name': user.get('farm_name', 'N/A'),
                'email': user.get('email', 'N/A'),
                'verification_status': user.get('business_verification_status', 'pending'),
                'submitted_at': user.get('business_verification_submitted_at'),
                'confidence': ml.get('confidence') if ml else None,
                'valid': ml.get('valid') if ml else None,
                'extracted_text': ml.get('extracted_text', '') if ml else '',
                'quality_check': ml.get('quality_check', {}) if ml else {},
                'document_detection': ml.get('ml_prediction', {}) if ml else {},
                'permit_validation': ml.get('permit_validation', {}) if ml else {},
                'timestamp': ml.get('timestamp') if ml else None,
            }
        }), 200
    except Exception as e:
        print(f"User verification status error: {e}")
        return jsonify({'error': str(e)}), 500


# ------------------------------------------------------------------
# Permit Verification Records from Database
# ------------------------------------------------------------------
@admin_bp.route('/api/admin/permit-verifications', methods=['GET'])
@token_required
def get_permit_verifications_db():
    """Get permit verifications from MongoDB PermitVerification collection"""
    try:
        from models import PermitVerification, User as MongoUser
        
        # Check admin access
        admin_user = MongoUser.objects(email=request.user_email, role='admin').first()
        if not admin_user:
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get query parameters
        status = request.args.get('status', '')  # 'pending', 'verified', 'rejected'
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        # Build query
        query = {}
        if status and status in ['pending', 'verified', 'rejected', 'under_review']:
            query['status'] = status
        
        # Get total count
        total = PermitVerification.objects(**query).count()
        
        # Get paginated results
        skip = (page - 1) * per_page
        records = PermitVerification.objects(**query).order_by('-created_at')[skip:skip+per_page]
        
        verifications = []
        for record in records:
            user_info = {
                'id': str(record.user.id),
                'email': record.user.email,
                'name': f"{record.user.first_name} {record.user.last_name}",
                'farm_name': record.user.farm_name or 'N/A',
            } if record.user else {}
            
            verifications.append({
                'id': str(record.id),
                'user': user_info,
                'status': record.status,
                'confidence': record.confidence,
                'valid': record.valid,
                'permit_business_name': record.permit_business_name,
                'dti_business_name': record.dti_business_name,
                'ml_confidence': record.ml_confidence,
                'ml_is_permit': record.ml_is_permit,
                'qr_valid': record.qr_valid,
                'admin_notes': record.admin_notes,
                'created_at': record.created_at.isoformat() if record.created_at else None,
                'reviewed_at': record.reviewed_at.isoformat() if record.reviewed_at else None,
            })
        
        return jsonify({
            'verifications': verifications,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        }), 200
        
    except Exception as e:
        print(f"Permit verifications error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/api/admin/permit-verifications/<verification_id>', methods=['GET'])
@token_required
def get_permit_verification_detail(verification_id):
    """Get full details of a specific permit verification"""
    try:
        from models import PermitVerification, User as MongoUser
        
        # Check admin access
        admin_user = MongoUser.objects(email=request.user_email, role='admin').first()
        if not admin_user:
            return jsonify({'error': 'Admin access required'}), 403
        
        record = PermitVerification.objects(id=verification_id).first()
        if not record:
            return jsonify({'error': 'Verification record not found'}), 404
        
        user_info = {
            'id': str(record.user.id),
            'email': record.user.email,
            'name': f"{record.user.first_name} {record.user.last_name}",
            'farm_name': record.user.farm_name or 'N/A',
        } if record.user else {}
        
        return jsonify({
            'id': str(record.id),
            'user': user_info,
            'status': record.status,
            'confidence': record.confidence,
            'valid': record.valid,
            'permit_business_name': record.permit_business_name,
            'permit_owner_name': record.permit_owner_name,
            'dti_business_name': record.dti_business_name,
            'dti_owner_name': record.dti_owner_name,
            'ml_confidence': record.ml_confidence,
            'ml_is_permit': record.ml_is_permit,
            'qr_valid': record.qr_valid,
            'qr_data': record.qr_data,
            'image_filename': record.image_filename,
            'full_result': record.verification_result,
            'admin_notes': record.admin_notes,
            'reviewed_by': record.reviewed_by,
            'created_at': record.created_at.isoformat() if record.created_at else None,
            'reviewed_at': record.reviewed_at.isoformat() if record.reviewed_at else None,
        }), 200
        
    except Exception as e:
        print(f"Permit verification detail error: {e}")
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/api/admin/permit-verifications/<verification_id>', methods=['PUT'])
@token_required
def update_permit_verification(verification_id):
    """Update permit verification status and notes"""
    try:
        from models import PermitVerification, User as MongoUser
        from bson import ObjectId
        
        # Check admin access
        admin_user = MongoUser.objects(email=request.user_email, role='admin').first()
        if not admin_user:
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        new_status = data.get('status')  # 'verified', 'rejected', 'under_review'
        admin_notes = data.get('admin_notes', '')
        
        if new_status not in ['pending', 'verified', 'rejected', 'under_review']:
            return jsonify({'error': 'Invalid status'}), 400
        
        record = PermitVerification.objects(id=verification_id).first()
        if not record:
            return jsonify({'error': 'Verification record not found'}), 404
        
        # Update record
        record.status = new_status
        record.admin_notes = admin_notes
        record.reviewed_by = request.user_email
        record.reviewed_at = datetime.utcnow()
        record.save()
        
        # If approving, also update the user's role to farmer
        if new_status == 'verified' and record.user:
            record.user.role = 'farmer'
            record.user.business_verification_status = 'verified'
            record.user.save()
        
        return jsonify({
            'id': str(record.id),
            'status': record.status,
            'message': f'Verification {new_status} successfully',
        }), 200
        
    except Exception as e:
        print(f"Update permit verification error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500



@admin_bp.route('/admin/permit-dashboard')
@login_required
def permit_dashboard():
    try:
        db, _ = get_mongodb_db(admin_bp)
        if db is None:
            flash('Database connection failed.', 'error')
            return redirect('/')

        users_col = db.users
        all_users = list(users_col.find({'business_verification_ml': {'$exists': True, '$ne': None}}))

        verified_count = users_col.count_documents({'business_verification_ml': {'$exists': True, '$ne': None}, 'business_verification_status': 'verified'})
        rejected_count = users_col.count_documents({'business_verification_ml': {'$exists': True, '$ne': None}, 'business_verification_status': 'rejected'})

        verifications = []
        for u in all_users:
            ml = u.get('business_verification_ml', {})
            status = u.get('business_verification_status', 'rejected')
            verifications.append({
                'id': str(u.get('_id')),
                'farmer_name': f"{u.get('first_name', '')} {u.get('last_name', '')}".strip(),
                'farm_name': u.get('farm_name', 'N/A'),
                'email': u.get('email', 'N/A'),
                'status': status,
                'valid': ml.get('valid', False),
                'rejected': status == 'rejected',
                'confidence': ml.get('confidence', 0),
                'timestamp': ml.get('timestamp', 'N/A'),
                'extracted_text': ml.get('extracted_text', '')[:100],
                'quality_check': ml.get('quality_check', {}),
                'document_detection': ml.get('document_detection', {}),
                'permit_validation': ml.get('permit_validation', {}),
            })

        return render_template(
            'permit_verification_dashboard.html',
            verifications=verifications,
            verified_count=verified_count,
            rejected_count=rejected_count,
            total_submissions=len(all_users),
        )
    except Exception as e:
        print(f"Dashboard error: {e}")
        flash('Error loading dashboard', 'danger')
        return redirect('/')


@admin_bp.route('/admin/permit-details/<user_id>')
@login_required
def get_permit_details(user_id):
    try:
        db, _ = get_mongodb_db(admin_bp)
        if db is None:
            return {'error': 'Database connection failed'}, 500

        user = db.users.find_one({'_id': user_id, 'business_verification_ml': {'$exists': True, '$ne': None}})
        if not user:
            return {'error': 'User not found or has no verification submission'}, 404

        ml = user.get('business_verification_ml', {})
        return {
            'farmer_name': f"{user.get('first_name', '')} {user.get('last_name', '')}".strip(),
            'farm_name': user.get('farm_name', 'N/A'),
            'email': user.get('email', 'N/A'),
            'phone': user.get('phone', 'N/A'),
            'status': user.get('business_verification_status', 'rejected'),
            'confidence': ml.get('confidence', 0),
            'extracted_text': ml.get('extracted_text', ''),
            'quality_check': ml.get('quality_check', {}),
            'document_detection': ml.get('ml_prediction', {}),
            'permit_validation': ml.get('permit_validation', {}),
            'timestamp': ml.get('timestamp', ''),
            'full_result': ml,
        }
    except Exception as e:
        return {'error': str(e)}, 500


# ------------------------------------------------------------------
# Debug endpoints
# ------------------------------------------------------------------
@admin_bp.route('/debug/database-status', methods=['GET'])
@login_required
def debug_database_status():
    try:
        from models import User as MEUser, Product

        db, _ = get_mongodb_db(admin_bp)
        me_count = MEUser.objects().count()
        pymongo_count = db.users.count_documents({}) if db else 0

        me_user = MEUser.objects(email=current_user.email).first()
        pymongo_user = db.users.find_one({'email': current_user.email}) if db else None
        ensured = ensure_mongoengine_user(current_user)

        return {
            'status': 'ok',
            'mongoengine_users': me_count,
            'pymongo_users': pymongo_count,
            'me_user_found': me_user is not None,
            'pymongo_user_found': pymongo_user is not None,
            'ensure_result': ensured is not None,
        }
    except Exception as e:
        import traceback
        return {'error': str(e), 'traceback': traceback.format_exc()}, 500


@admin_bp.route('/debug/user-info', methods=['GET'])
@login_required
def debug_user_info():
    try:
        from models import User as MEUser, Product

        db, _ = get_mongodb_db(admin_bp)
        me_user = ensure_mongoengine_user(current_user)
        pymongo_user = db.users.find_one({'email': current_user.email}) if db else None
        mongoengine_user = MEUser.objects(email=current_user.email).first()

        products = list(Product.objects(farmer=me_user)) if me_user else []

        return {
            'current_user': {
                'email': current_user.email,
                'type': type(current_user).__name__,
                'role': getattr(current_user, 'role', 'user'),
                'authenticated': current_user.is_authenticated,
            },
            'mongoengine_user': {
                'found': mongoengine_user is not None,
                'email': mongoengine_user.email if mongoengine_user else None,
                'role': mongoengine_user.role if mongoengine_user else None,
                'id': str(mongoengine_user.id) if mongoengine_user else None,
            },
            'pymongo_user': {
                'found': pymongo_user is not None,
                'email': pymongo_user.get('email') if pymongo_user else None,
                'role': pymongo_user.get('role') if pymongo_user else None,
            },
            'ensure_mongoengine_user_result': {
                'found': me_user is not None,
                'email': me_user.email if me_user else None,
                'role': me_user.role if me_user else None,
                'id': str(me_user.id) if me_user else None,
            },
            'products_count': len(products),
            'products': [{'name': p.name, 'id': str(p.id)} for p in products],
        }
    except Exception as e:
        import traceback
        return {'error': str(e), 'traceback': traceback.format_exc()}, 500


# ------------------------------------------------------------------
# Geocode proxy
# ------------------------------------------------------------------
@admin_bp.route('/api/geocode', methods=['POST'])
def geocode():
    try:
        import requests as http_requests

        data = request.get_json()
        lat = data.get('lat')
        lon = data.get('lon')
        if not lat or not lon:
            return {'error': 'Missing coordinates'}, 400

        resp = http_requests.get(
            f'https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=18&addressdetails=1',
            headers={'Accept': 'application/json', 'User-Agent': 'FarmtoClick/1.0'},
            timeout=10,
        )
        if resp.status_code == 200:
            return resp.json()
        return {'error': 'Geocoding failed'}, resp.status_code
    except Exception as e:
        print(f"Geocoding error: {e}")
        return {'error': str(e)}, 500
