import React, { useEffect, useState, useMemo } from 'react';
import './App.css'; // Make sure this is included

export default function App() {
  const API_BASE = 'http://localhost:5050/api/v1/tours';

  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [fields, setFields] = useState({ name: true, price: true, duration: true, difficulty: true, summary: false });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);
  const [totalPages, setTotalPages] = useState(1);

  const visibleFields = useMemo(() => Object.keys(fields).filter(k => fields[k]).join(','), [fields]);

  function buildQuery() {
    const params = new URLSearchParams();
    if (search) params.set('name', search);
    if (difficulty) params.set('difficulty', difficulty);
    if (minPrice) params.set('price[gte]', minPrice);
    if (maxPrice) params.set('price[lte]', maxPrice);
    if (sortBy) params.set('sort', sortBy);
    if (visibleFields) params.set('fields', visibleFields);
    params.set('page', page);
    params.set('limit', limit);
    return params.toString();
  }

  async function fetchTours() {
    setLoading(true);
    setError(null);
    try {
      const q = buildQuery();
      const res = await fetch(`${API_BASE}/?${q}`);
      if (!res.ok) throw new Error(`Failed to fetch tours: ${res.status}`);
      const data = await res.json();

      if (data.data && data.data.tours) setTours(data.data.tours);
      else if (data.tours) setTours(data.tours);
      else if (Array.isArray(data)) setTours(data);
      else if (data.results) setTours(data.results);
      else if (data.data) setTours(Array.isArray(data.data) ? data.data : []);
      else setTours([]);

      if (data.pagination && data.pagination.totalPages) setTotalPages(data.pagination.totalPages);
      else if (data.total && data.total > 0) setTotalPages(Math.ceil(data.total / limit));
      else setTotalPages(tours.length < limit ? page : page + 1);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTours();
  }, [page, limit, sortBy, difficulty, minPrice, maxPrice, visibleFields]);

  async function onSearchKey(e) {
    if (e.key === 'Enter') {
      setPage(1);
      await fetchTours();
    }
  }

  async function deleteTour(id) {
    if (!window.confirm('Delete this tour? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setTours(prev => prev.filter(t => t._id !== id && t.id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  }

  async function deleteAllTours() {
    if (!window.confirm('Delete ALL tours?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/?limit=1000`);
      const json = await res.json();
      const list = json.data && json.data.tours ? json.data.tours : json.tours || json;
      if (!Array.isArray(list) || list.length === 0) {
        alert('No tours found to delete.');
        return;
      }
      for (const t of list) {
        const id = t._id || t.id;
        if (!id) continue;
        await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      }
      alert('All tours deleted. Refreshing...');
      setPage(1);
      await fetchTours();
    } catch (err) {
      alert('Delete all failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleField(field) {
    setFields(prev => ({ ...prev, [field]: !prev[field] }));
  }

  function applySort(option) {
    setSortBy(option);
    setPage(1);
  }

  function gotoPage(p) {
    if (p < 1) p = 1;
    setPage(p);
  }

  function formatPrice(p) {
    return p == null ? '-' : `$${p}`;
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>Tours Explorer</h1>
        <div className="header-buttons">
          <button className="btn btn-red" onClick={deleteAllTours}>Delete All Tours</button>
          <button className="btn btn-blue" onClick={() => { setPage(1); fetchTours(); }}>Refresh</button>
        </div>
        <p className="header-subtitle">Explore tours with filtering, sorting, pagination, and field limiting.</p>
      </header>

      <main className="main-content">
        <aside className="sidebar">
          <div className="control-group">
            <label>Search (press Enter)</label>
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={onSearchKey} placeholder="Search by name..." />
          </div>

          <div className="control-group">
            <label>Filters</label>
            <select value={difficulty} onChange={e => { setDifficulty(e.target.value); setPage(1); }}>
              <option value="">All difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="difficult">Difficult</option>
            </select>
            <div className="price-inputs">
              <input type="number" placeholder="Min price" value={minPrice} onChange={e => { setMinPrice(e.target.value); setPage(1); }} />
              <input type="number" placeholder="Max price" value={maxPrice} onChange={e => { setMaxPrice(e.target.value); setPage(1); }} />
            </div>
          </div>

          <div className="control-group">
            <label>Sort</label>
            <select value={sortBy} onChange={e => applySort(e.target.value)}>
              <option value="">Default</option>
              <option value="price">Price ↑</option>
              <option value="-price">Price ↓</option>
              <option value="duration">Duration ↑</option>
              <option value="-duration">Duration ↓</option>
              <option value="-ratingsAverage">Top Rated</option>
            </select>
          </div>

          <div className="control-group">
            <label>Fields (field limiting)</label>
            <div className="checkbox-grid">
              {Object.keys(fields).map(f => (
                <label key={f}>
                  <input type="checkbox" checked={fields[f]} onChange={() => toggleField(f)} />
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label>Page size</label>
            <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}>
              <option value={3}>3</option>
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
            </select>
          </div>
        </aside>

        <section className="tours-section">
          {loading && <div className="loading">Loading...</div>}
          {error && <div className="error">{error}</div>}
          {!loading && !error && tours.length === 0 && <div className="error">No tours found.</div>}

          <div className="tours-grid">
            {tours.map(tour => (
              <div key={tour._id || tour.id} className="tour-card">
                {fields.name && <h2>{tour.name}</h2>}
                {fields.summary && <p>{tour.summary}</p>}
                <div className="tour-tags">
                  {fields.difficulty && <span className={`tag difficulty ${tour.difficulty}`}>{tour.difficulty}</span>}
                  {fields.duration && <span className="tag duration">{tour.duration} days</span>}
                  {fields.price && <span className="tag price">{formatPrice(tour.price)}</span>}
                </div>
                <button className="btn btn-red btn-small" onClick={() => deleteTour(tour._id || tour.id)}>Delete</button>
              </div>
            ))}
          </div>

          <div className="pagination">
            <button onClick={() => gotoPage(page - 1)} disabled={page <= 1} className="btn btn-light">Prev</button>
            <span>Page {page} of {totalPages}</span>
            <button onClick={() => gotoPage(page + 1)} disabled={page >= totalPages} className="btn btn-light">Next</button>
          </div>
        </section>
      </main>
    </div>
  );
}
