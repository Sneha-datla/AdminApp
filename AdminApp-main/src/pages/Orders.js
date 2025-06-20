import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const ListingsModeration = () => {
  const initialListings = [
    {
      id: 'GL001',
      title: '24K Gold Necklace',
      description: 'Premium handcrafted gold necklace with traditional design',
      purity: '24K',
      price: 2450,
      image: 'https://via.placeholder.com/50x50?text=Necklace',
      status: 'Pending',
    },
    {
      id: 'GL002',
      title: 'Diamond Gold Earrings',
      description: 'Elegant pair of 22K gold earrings featuring brilliant diamonds',
      purity: '22K',
      price: 1850,
      image: 'https://via.placeholder.com/50x50?text=Earrings',
      status: 'Pending',
    },
    {
      id: 'GL003',
      title: 'Vintage Gold Bracelet',
      description: 'Vintage inspired 18K gold bracelet with intricate patterns',
      purity: '18K',
      price: 980,
      image: 'https://via.placeholder.com/50x50?text=Bracelet',
      status: 'Pending',
    },
    {
      id: 'GL004',
      title: 'Modern Gold Ring',
      description: 'Contemporary 22K gold ring featuring geometric design',
      purity: '22K',
      price: 650,
      image: 'https://via.placeholder.com/50x50?text=Ring',
      status: 'Pending',
    },
  ];

  const [listings, setListings] = useState(initialListings);

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
