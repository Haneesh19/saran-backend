import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import './Bidding.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BiddingPage = ({ darkMode }) => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    startingBid: '',
    currentBid: '',
    endTime: '',
    imageUrl: '', // Add imageUrl field
  });
  
  const { loggedIn, userId } = useAuth();
  const navigate = useNavigate();
  const [bidAmount, setBidAmount] = useState(localStorage.getItem('bidAmount') || '');
  const [modifyProductId, setModifyProductId] = useState(null);
  const [currentBid, setCurrentBid] = useState(localStorage.getItem('currentBid') || '');

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`https://saran-frontend.onrender.com/api/getBids?userId=${userId}`);
      setProducts(response.data.bids);
    } catch (error) {
      console.error('Error fetching bids:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  const handleImageChange = (e) => {
    setNewProduct({ ...newProduct, image: e.target.files[0] });
  };

  const handleAddProduct = async () => {
    if (loggedIn) {
      const { startingBid, currentBid, name, description, endTime, image } = newProduct;

      if (!name || !description || !startingBid || !currentBid || !endTime || !image) {
        alert('Please fill all the required bid details first.');
        return;
      }

      const numericStartingBid = parseInt(startingBid);
      const numericCurrentBid = parseInt(currentBid);

      if (numericCurrentBid < numericStartingBid) {
        alert('Current bid must be greater than or equal to the starting bid');
        return;
      }

      const formData = new FormData();
      formData.append('image', image);

      try {
        const uploadResponse = await axios.post('https://saran-frontend.onrender.com/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const imageUrl = uploadResponse.data.imageUrl;

        const response = await axios.post('https://saran-frontend.onrender.com/api/addBid', {
          ...newProduct,
          userId,
          currentBid: numericCurrentBid || numericStartingBid,
          imageUrl, // Add imageUrl to the product data
        });

        if (response.status === 200) {
          alert('Bid added successfully');
          const updatedProducts = [...products, { ...response.data.bid }];
          setProducts(updatedProducts);
          localStorage.setItem('products', JSON.stringify(updatedProducts));
        } else {
          alert('Failed to add bid');
        }
      } catch (err) {
        console.error('Error adding bid:', err);
        alert('An error occurred while adding bid');
      }
    } else {
      alert('Please login first');
      navigate('/login');
    }
  };

  // Rest of the component code remains unchanged...

  return (
    <div className={`bidding-page ${darkMode ? 'dark-mode' : ''}`}>
      <h2>Add Product for Auction</h2>
      <div>
        <label>Name:</label>
        <input type="text" name="name" value={newProduct.name || ''} onChange={handleInputChange} />
      </div>
      <div>
        <label>Description:</label>
        <input type="text" name="description" value={newProduct.description || ''} onChange={handleInputChange} />
      </div>
      <div>
        <label>Starting Bid:</label>
        <input type="number" name="startingBid" value={newProduct.startingBid || ''} onChange={handleInputChange} />
      </div>
      <div>
        <label>Current Bid:</label>
        <input type="number" name="currentBid" value={newProduct.currentBid} onChange={handleInputChange} />
      </div>
      <div>
        <label>End Time:</label>
        <input type="datetime-local" name="endTime" value={newProduct.endTime || ''} onChange={handleInputChange} />
      </div>
      <div>
        <label>Image:</label>
        <input type="file" onChange={handleImageChange} />
      </div>
      <button onClick={handleAddProduct}>Add Product</button>
      <pre></pre>

      <h3>Products you have added:</h3> <pre></pre>
      {products.map(product => (
        product.userId === userId && (
          <div key={product._id} className="product">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p>Starting Bid: ${product.startingBid}</p>
            <p>Current Bid: ${product.currentBid}</p>
            <img src={product.imageUrl} alt={product.name} width="100" />
            {modifyProductId === product._id ? (
              <div>
                <label>Enter Your Modified Bid:</label>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => {
                    setBidAmount(e.target.value);
                    localStorage.setItem('bidAmount', e.target.value);
                  }}
                />
                <button onClick={() => handleConfirmModifyBid(product._id, bidAmount)}>
                  Confirm Modification
                </button>
              </div>
            ) : (
              <button onClick={() => handleModifyBid(product._id, product.currentBid)}>
                Modify Bid
              </button>
            )}
            <button onClick={() => handleDeleteProduct(product._id)}>Delete Product</button>
          </div>
        )
      ))}
    </div>
  );
};

export default BiddingPage;
