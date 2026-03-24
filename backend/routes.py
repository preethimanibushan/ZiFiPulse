from flask import Blueprint, jsonify, request
from .models import db, Loan
from .lendio_service import LendioService

api_bp = Blueprint('api', __name__, url_prefix='/api')

@api_bp.route('/loans', methods=['GET'])
def get_loans():
    """Get all loans with optional filtering"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status', None)
    
    query = Loan.query
    
    if status:
        query = query.filter_by(loan_status=status)
    
    loans = query.paginate(page=page, per_page=per_page)
    
    return jsonify({
        'loans': [loan.to_dict() for loan in loans.items],
        'total': loans.total,
        'pages': loans.pages,
        'current_page': page
    }), 200

@api_bp.route('/loans/<int:loan_id>', methods=['GET'])
def get_loan(loan_id):
    """Get a specific loan by ID"""
    loan = Loan.query.get(loan_id)
    
    if not loan:
        return jsonify({'error': 'Loan not found'}), 404
    
    return jsonify(loan.to_dict()), 200

@api_bp.route('/statistics', methods=['GET'])
def get_statistics():
    """Get loan statistics"""
    stats = {
        'total_loans': Loan.query.count(),
        'total_amount': db.session.query(db.func.sum(Loan.loan_amount)).scalar() or 0,
        'average_amount': db.session.query(db.func.avg(Loan.loan_amount)).scalar() or 0
    }
    
    status_breakdown = db.session.query(
        Loan.loan_status, 
        db.func.count(Loan.id),
        db.func.sum(Loan.loan_amount)
    ).group_by(Loan.loan_status).all()
    
    stats['status_breakdown'] = [
        {'status': status, 'count': count, 'total_amount': amount}
        for status, count, amount in status_breakdown
    ]
    
    return jsonify(stats), 200

@api_bp.route('/sync', methods=['POST'])
def sync_loans(lendio_service):
    """Sync loans from Lendio API"""
    success = lendio_service.sync_loans()
    
    if success:
        return jsonify({'message': 'Loans synced successfully'}), 200
    else:
        return jsonify({'error': 'Failed to sync loans'}), 500

@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200
