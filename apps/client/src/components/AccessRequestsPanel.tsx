import React, { useState, useEffect } from 'react';

interface AccessRequest {
  id: string;
  email: string;
  name?: string;
  message?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  reviewedByUser?: {
    id: string;
    name?: string;
    username?: string;
    email: string;
  };
}

interface AccessRequestsPanelProps {
  user: any;
}

const AccessRequestsPanel: React.FC<AccessRequestsPanelProps> = ({ user }) => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/v2/access-requests?${params}`, {
        credentials: 'include'
      });

      const result = await response.json();

      if (result.ok) {
        setRequests(result.requests);
        setTotalPages(result.pagination.totalPages);
      } else {
        setError(result.error || 'Failed to fetch access requests');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter]);

  const handleStatusUpdate = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      setActionLoading(requestId);
      const response = await fetch(`/api/v2/access-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status,
          reviewNotes: reviewNotes || null
        }),
      });

      const result = await response.json();

      if (result.ok) {
        await fetchRequests();
        setSelectedRequest(null);
        setReviewNotes('');
      } else {
        setError(result.error || 'Failed to update request');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleInvite = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      const response = await fetch(`/api/v2/access-requests/${requestId}/invite`, {
        method: 'POST',
        credentials: 'include'
      });

      const result = await response.json();

      if (result.ok) {
        await fetchRequests();
        setSelectedRequest(null);
        setReviewNotes('');
      } else {
        setError(result.error || 'Failed to send invitation');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this access request?')) {
      return;
    }

    try {
      setActionLoading(requestId);
      const response = await fetch(`/api/v2/access-requests/${requestId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (result.ok) {
        await fetchRequests();
      } else {
        setError(result.error || 'Failed to delete request');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#ffc107';
      case 'APPROVED': return '#28a745';
      case 'REJECTED': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading access requests...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0 }}>Access Requests</h2>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              marginRight: '10px'
            }}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      <div style={{ 
        backgroundColor: 'white', 
        border: '1px solid #dee2e6', 
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
          gap: '1px',
          backgroundColor: '#dee2e6',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          <div style={{ padding: '12px', backgroundColor: 'white' }}>Email</div>
          <div style={{ padding: '12px', backgroundColor: 'white' }}>Name</div>
          <div style={{ padding: '12px', backgroundColor: 'white' }}>Status</div>
          <div style={{ padding: '12px', backgroundColor: 'white' }}>Requested</div>
          <div style={{ padding: '12px', backgroundColor: 'white' }}>Reviewed By</div>
          <div style={{ padding: '12px', backgroundColor: 'white' }}>Actions</div>
        </div>

        {requests.map((request) => (
          <div key={request.id} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
            gap: '1px',
            backgroundColor: '#dee2e6',
            fontSize: '14px'
          }}>
            <div style={{ padding: '12px', backgroundColor: 'white' }}>
              {request.email}
            </div>
            <div style={{ padding: '12px', backgroundColor: 'white' }}>
              {request.name || '-'}
            </div>
            <div style={{ padding: '12px', backgroundColor: 'white' }}>
              <span style={{
                backgroundColor: getStatusColor(request.status),
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {request.status}
              </span>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'white' }}>
              {formatDate(request.requestedAt)}
            </div>
            <div style={{ padding: '12px', backgroundColor: 'white' }}>
              {request.reviewedByUser ? (
                <div>
                  <div>{request.reviewedByUser.name || request.reviewedByUser.username}</div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    {formatDate(request.reviewedAt!)}
                  </div>
                </div>
              ) : '-'}
            </div>
            <div style={{ padding: '12px', backgroundColor: 'white' }}>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setSelectedRequest(request)}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  View
                </button>
                {request.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleInvite(request.id)}
                      disabled={actionLoading === request.id}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: actionLoading === request.id ? '#6c757d' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: actionLoading === request.id ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {actionLoading === request.id ? '...' : 'Invite'}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(request.id, 'REJECTED')}
                      disabled={actionLoading === request.id}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: actionLoading === request.id ? '#6c757d' : '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: actionLoading === request.id ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {actionLoading === request.id ? '...' : 'Remove'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(request.id)}
                  disabled={actionLoading === request.id}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: actionLoading === request.id ? '#6c757d' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: actionLoading === request.id ? 'not-allowed' : 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {actionLoading === request.id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginTop: '20px',
          gap: '8px'
        }}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 16px',
              backgroundColor: page === 1 ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: page === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          <span style={{ padding: '8px 16px', alignSelf: 'center' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            style={{
              padding: '8px 16px',
              backgroundColor: page === totalPages ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: page === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Access Request Details</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <strong>Email:</strong> {selectedRequest.email}
            </div>
            
            {selectedRequest.name && (
              <div style={{ marginBottom: '16px' }}>
                <strong>Name:</strong> {selectedRequest.name}
              </div>
            )}
            
            {selectedRequest.message && (
              <div style={{ marginBottom: '16px' }}>
                <strong>Message:</strong>
                <div style={{ 
                  marginTop: '8px', 
                  padding: '12px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedRequest.message}
                </div>
              </div>
            )}
            
            <div style={{ marginBottom: '16px' }}>
              <strong>Requested:</strong> {formatDate(selectedRequest.requestedAt)}
            </div>
            
            {selectedRequest.reviewedAt && (
              <div style={{ marginBottom: '16px' }}>
                <strong>Reviewed:</strong> {formatDate(selectedRequest.reviewedAt)}
                {selectedRequest.reviewedByUser && (
                  <span> by {selectedRequest.reviewedByUser.name || selectedRequest.reviewedByUser.username}</span>
                )}
              </div>
            )}
            
            {selectedRequest.reviewNotes && (
              <div style={{ marginBottom: '16px' }}>
                <strong>Review Notes:</strong>
                <div style={{ 
                  marginTop: '8px', 
                  padding: '12px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '4px'
                }}>
                  {selectedRequest.reviewNotes}
                </div>
              </div>
            )}

            {selectedRequest.status === 'PENDING' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Review Notes (Optional):
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}
            
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              justifyContent: 'flex-end',
              marginTop: '24px'
            }}>
              {selectedRequest.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleInvite(selectedRequest.id)}
                    disabled={actionLoading === selectedRequest.id}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: actionLoading === selectedRequest.id ? '#6c757d' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: actionLoading === selectedRequest.id ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {actionLoading === selectedRequest.id ? 'Sending...' : 'Invite'}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'REJECTED')}
                    disabled={actionLoading === selectedRequest.id}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: actionLoading === selectedRequest.id ? '#6c757d' : '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: actionLoading === selectedRequest.id ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {actionLoading === selectedRequest.id ? 'Updating...' : 'Remove'}
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setReviewNotes('');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessRequestsPanel;
