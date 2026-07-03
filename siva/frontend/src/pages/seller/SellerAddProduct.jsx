import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../../services/api.js';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const SellerAddProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [tax, setTax] = useState(0);
  const [shippingCharges, setShippingCharges] = useState(0);
  const [returnPolicy, setReturnPolicy] = useState('7 days replacement policy');
  const [warranty, setWarranty] = useState('1 year manufacturer warranty');
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([{ size: '', color: '', stock: 0, price: 0, offerPrice: 0, sku: '' }]);

  // Fetch lists
  const { data: categoriesRes } = useQuery({ queryKey: ['categories'], queryFn: () => API.get('/marketing/categories') });
  const { data: brandsRes } = useQuery({ queryKey: ['brands'], queryFn: () => API.get('/marketing/brands') });

  const categories = categoriesRes?.data?.categories || [];
  const brands = brandsRes?.data?.brands || [];

  // Edit load details
  useEffect(() => {
    if (isEditMode) {
      const fetchProduct = async () => {
        try {
          const res = await API.get(`/products/${id}`);
          const p = res.data.product;
          setTitle(p.title);
          setDescription(p.description);
          setCategory(p.category?._id || p.category);
          setBrand(p.brand?._id || p.brand);
          setTax(p.tax || 0);
          setShippingCharges(p.shippingCharges || 0);
          setReturnPolicy(p.returnPolicy);
          setWarranty(p.warranty);
          setVariants(p.variants);
        } catch (err) {
          toast.error('Failed to load product details');
        }
      };
      fetchProduct();
    }
  }, [id, isEditMode]);

  // Mutations
  const productMutation = useMutation({
    mutationFn: (formData) => {
      if (isEditMode) {
        return API.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      return API.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      toast.success(isEditMode ? 'Product updated successfully!' : 'Product added successfully!');
      queryClient.invalidateQueries(['sellerProducts']);
      navigate('/seller/products');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save product');
    },
  });

  const handleVariantChange = (idx, field, val) => {
    const updated = [...variants];
    updated[idx][field] = val;
    setVariants(updated);
  };

  const addVariantField = () => {
    setVariants([...variants, { size: '', color: '', stock: 0, price: 0, offerPrice: 0, sku: '' }]);
  };

  const removeVariantField = (idx) => {
    if (variants.length === 1) return;
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !description || !category || !brand) {
      return toast.error('Please enter all basic information');
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('brand', brand);
    formData.append('tax', tax);
    formData.append('shippingCharges', shippingCharges);
    formData.append('returnPolicy', returnPolicy);
    formData.append('warranty', warranty);
    formData.append('variants', JSON.stringify(variants));

    images.forEach((img) => {
      formData.append('images', img);
    });

    productMutation.mutate(formData);
  };

  return (
    <div className="bg-white rounded-sm border border-gray-100 p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 border-b border-gray-50 dark:border-zinc-850 pb-4">
        <button onClick={() => navigate('/seller/products')} className="text-gray-400 hover:text-zinc-600 dark:hover:text-white">
          <ArrowLeft size={18} />
        </button>
        <h3 className="font-bold text-base dark:text-white">
          {isEditMode ? 'Edit Product Details' : 'Add New Catalog Product'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-sm">
        
        {/* Core details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Product Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-250 rounded-sm focus:outline-none dark:border-zinc-800 bg-transparent"
              placeholder="E.g., Mi 11X Pro 5G Mobile"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Product Category</label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-250 rounded-sm focus:outline-none dark:border-zinc-800 bg-transparent font-semibold"
            >
              <option value="">Choose Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-255 rounded-sm focus:outline-none dark:border-zinc-800 bg-transparent"
            placeholder="Detailed description of features, specs, and materials"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Product Brand</label>
            <select
              required
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-3 py-2 border border-gray-250 rounded-sm focus:outline-none dark:border-zinc-800 bg-transparent font-semibold"
            >
              <option value="">Choose Brand</option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Select Images</label>
            <input
              type="file"
              multiple
              onChange={handleImageChange}
              className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-zinc-700 hover:file:bg-gray-200 dark:file:bg-zinc-800 dark:file:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Tax Percentage (%)</label>
            <input
              type="number"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none dark:border-zinc-800 bg-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Shipping Cost (&#8377;)</label>
            <input
              type="number"
              value={shippingCharges}
              onChange={(e) => setShippingCharges(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none dark:border-zinc-800 bg-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Return Window</label>
            <input
              type="text"
              value={returnPolicy}
              onChange={(e) => setReturnPolicy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none dark:border-zinc-800 bg-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Warranty Term</label>
            <input
              type="text"
              value={warranty}
              onChange={(e) => setWarranty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none dark:border-zinc-800 bg-transparent"
            />
          </div>
        </div>

        {/* Variants configuration section */}
        <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-zinc-850">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-xs uppercase text-gray-400">Inventory Variants</h4>
            <button
              type="button"
              onClick={addVariantField}
              className="text-xs text-primary-500 hover:underline font-bold flex items-center gap-0.5"
            >
              <Plus size={12} /> Add Variant
            </button>
          </div>

          <div className="space-y-3">
            {variants.map((v, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-3 border border-gray-50 p-4 rounded-sm dark:border-zinc-850 relative">
                
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariantField(idx)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                )}

                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 w-full">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Size</label>
                    <input
                      type="text"
                      value={v.size}
                      onChange={(e) => handleVariantChange(idx, 'size', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded-sm text-xs focus:outline-none bg-transparent"
                      placeholder="E.g. XL, 6GB"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Color</label>
                    <input
                      type="text"
                      value={v.color}
                      onChange={(e) => handleVariantChange(idx, 'color', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded-sm text-xs focus:outline-none bg-transparent"
                      placeholder="Black"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Stock Qty</label>
                    <input
                      type="number"
                      required
                      value={v.stock}
                      onChange={(e) => handleVariantChange(idx, 'stock', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-200 rounded-sm text-xs focus:outline-none bg-transparent font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">List Price</label>
                    <input
                      type="number"
                      required
                      value={v.price}
                      onChange={(e) => handleVariantChange(idx, 'price', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-200 rounded-sm text-xs focus:outline-none bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Offer Price</label>
                    <input
                      type="number"
                      required
                      value={v.offerPrice}
                      onChange={(e) => handleVariantChange(idx, 'offerPrice', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-200 rounded-sm text-xs focus:outline-none bg-transparent font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">SKU Code</label>
                    <input
                      type="text"
                      required
                      value={v.sku}
                      onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded-sm text-xs focus:outline-none bg-transparent"
                      placeholder="SKU-MOBILE"
                    />
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={productMutation.isPending}
          className="w-full py-3 bg-secondary text-white font-bold rounded-sm text-xs hover:shadow flex items-center justify-center gap-1.5 transition disabled:opacity-50"
        >
          <Save size={16} /> {isEditMode ? 'Update Product Details' : 'Publish Product to Catalog'}
        </button>

      </form>

    </div>
  );
};

export default SellerAddProduct;
