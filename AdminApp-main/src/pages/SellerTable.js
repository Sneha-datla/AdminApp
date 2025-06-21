import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SellerProductTable = () => {
  const [products, setProducts] = useState([]);
  const [activeProduct, setActiveProduct] = useState(null);

  const API_URL = 'https://adminapp-1-nk19.onrender.com/seller/all';

  const fetchProducts = async () => {
    try {
      const response = await axios.get(API_URL);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure to delete this product?')) {
      try {
        // ⚠️ fakestoreapi does not support real deletion, just simulating it
await axios.delete(`https://adminapp-1-nk19.onrender.com/seller/${id}`);
        alert("Delete simulated (fake store doesn't remove real data)");
        fetchProducts(); // Reload list
        setActiveProduct(null);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleRowClick = (product) => {
    setActiveProduct(product.id === activeProduct?.id ? null : product);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div>
      <h4 className="mb-3">Seller Gold Products</h4>

      <table className="table table-bordered table-hover">
        <thead className="thead-dark">
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Category</th>
            <th>Weight</th>
            <th>Purity</th>
            <th>Condition</th>
            <th>Price</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length > 0 ? (
            products.map((product) => (
              <tr
                key={product.id}
                className={activeProduct?.id === product.id ? 'table-primary' : ''}
                onClick={() => handleRowClick(product)}
              >
                <td>
                  <img src={`https://adminapp-1-nk19.onrender.com${product.image}`} alt={product.name} width="50" />
                </td>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>{Math.floor(Math.random() * 50) + 1} gm</td> {/* Mocked weight */}
                <td>{['22K', '24K'][Math.floor(Math.random() * 2)]}</td> {/* Mocked purity */}
                <td>{['New', 'Used'][Math.floor(Math.random() * 2)]}</td> {/* Mocked condition */}
                <td>₹{product.price}</td>
                <td>{product.description.slice(0, 30)}...</td>
                <td>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(product.id);
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className="text-center">No products available.</td>
            </tr>
          )}
        </tbody>
      </table>

      {activeProduct && (
        <div className="card mt-4 p-3 shadow">
          <h5 className="mb-3">Product Details</h5>
          <div className="row">
            <div className="col-md-3">
              <img src={activeProduct.image} alt={activeProduct.title} className="img-fluid" />
            </div>
            <div className="col-md-9">
              <p><strong>Name:</strong> {activeProduct.title}</p>
              <p><strong>Category:</strong> {activeProduct.category}</p>
              <p><strong>Weight:</strong> {Math.floor(Math.random() * 50) + 1} gm</p>
              <p><strong>Purity:</strong> {['22K', '24K'][Math.floor(Math.random() * 2)]}</p>
              <p><strong>Condition:</strong> {['New', 'Used'][Math.floor(Math.random() * 2)]}</p>
              <p><strong>Price:</strong> ₹{activeProduct.price}</p>
              <p><strong>Description:</strong> {activeProduct.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProductTable;
