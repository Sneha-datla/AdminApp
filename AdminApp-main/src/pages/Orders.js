import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const ListingsModeration = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch listings from the API
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await axios.get('https://adminapp-1-nk19.onrender.com/order/all'); // Replace with your actual URL
        setListings(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch listings:', error);
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  

  const handleStatusChange = (id, newStatus) => {
    const updated = listings.map(item =>
      item.id === id ? { ...item, status: newStatus } : item
    );
    setListings(updated);
  };

  const statusCount = type => listings.filter(l => l.status === type).length;

  return (
    <div className="container mt-4 p-4 bg-light rounded shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Order Details</h5>
        <button className="btn btn-primary">📤 Export</button>
      </div>

      <div className="d-flex mb-3 align-items-center gap-3 flex-wrap">
        <span className="badge bg-warning text-dark">Pending {statusCount('Pending')}</span>
        <span className="badge bg-success">Approved {statusCount('Approved')}</span>
        <span className="badge bg-danger">Rejected {statusCount('Rejected')}</span>
      </div>

      <div className="d-flex mb-3 gap-2 flex-wrap">
        <input
          type="text"
          className="form-control"
          placeholder="🔍 Search listings..."
          style={{ maxWidth: '250px' }}
        />
        <select className="form-select" style={{ maxWidth: '150px' }}>
          <option>All Purity</option>
        </select>
        <select className="form-select" style={{ maxWidth: '150px' }}>
          <option>Price Range</option>
        </select>
      </div>

      <table className="table align-middle table-bordered bg-white">
        <thead className="table-light">
          <tr>
            <th>Image</th>
            <th>Title</th>
            <th>Description</th>
            <th>Purity</th>
            <th>Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {listings.map(item => (
            <tr key={item.id}>
              <td>
                <img src={item.image} alt="product" style={{ width: 50, height: 50, objectFit: 'cover' }} />
              </td>
              <td>
                <strong>{item.title}</strong><br />
                <small>ID: #{item.id}</small>
              </td>
              <td style={{ maxWidth: '200px' }}>{item.description}</td>
              <td>
                <span className="badge bg-warning text-dark">{item.purity}</span>
              </td>
              <td>${item.price.toLocaleString()}</td>
              <td>
                <span className={`badge ${
                  item.status === 'Pending' ? 'bg-warning text-dark'
                    : item.status === 'Approved' ? 'bg-success'
                    : 'bg-danger'
                }`}>
                  {item.status}
                </span>
              </td>
              <td>
                <button
                  className="btn btn-sm btn-success me-2"
                  onClick={() => handleStatusChange(item.id, 'Approved')}
                  disabled={item.status === 'Approved'}
                >
                  ✅ Approve
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleStatusChange(item.id, 'Rejected')}
                  disabled={item.status === 'Rejected'}
                >
                  ❌ Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <small>Showing 1–4 of {listings.length} listings</small>
        <nav>
          <ul className="pagination pagination-sm mb-0">
            <li className="page-item active"><button className="page-link">1</button></li>
            <li className="page-item"><button className="page-link">2</button></li>
            <li className="page-item"><button className="page-link">3</button></li>
            <li className="page-item"><button className="page-link">Next</button></li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default ListingsModeration;
