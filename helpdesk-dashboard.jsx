import React, { useState } from 'react';

// Icons
const Icons = {
  Inbox: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  WhatsApp: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  Email: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Form: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Chat: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Users: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Invoice: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  FileText: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Trello: () => <svg width="20" height="20" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/><rect x="6" y="6" width="4" height="10" rx="1" fill="currentColor"/><rect x="14" y="6" width="4" height="6" rx="1" fill="currentColor"/></svg>,
  UserCheck: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>,
  ShoppingCart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  Trash: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Package: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Minus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Info: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  Calendar: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Download: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  ArrowRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Link: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Receipt: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17V7"/></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Send: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  MoreVertical: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>,
  Paperclip: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  RefreshCw: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  Clock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

// Sample data
const generateSampleData = () => {
  const clients = [
    { id: 1, name: 'James Mokoena', email: 'james@example.com', phone: '+27 82 123 4567', company: 'Mokoena Legal' },
    { id: 2, name: 'Sarah Nkosi', email: 'sarah.nkosi@gmail.com', phone: '+27 83 234 5678', company: null },
    { id: 3, name: 'Peter van der Berg', email: 'peter@bergcorp.co.za', phone: '+27 84 345 6789', company: 'Berg Corp' },
    { id: 4, name: 'Thandi Dlamini', email: 'thandi@outlook.com', phone: '+27 85 456 7890', company: null },
    { id: 5, name: 'Michael Chen', email: 'm.chen@techfirm.com', phone: '+27 86 567 8901', company: 'TechFirm SA' },
  ];

  const agents = [
    { id: 1, name: 'Admin User', email: 'admin@easyservices.co.za', phone: '+27 11 000 0000', role: 'Administrator', avatar: 'AD', color: 'bg-amber-500', zohoVendorId: null, commissionRate: 0, status: 'active' },
    { id: 2, name: 'Sipho Ndlovu', email: 'sipho@easyservices.co.za', phone: '+27 82 123 4567', role: 'Senior Agent', avatar: 'SN', color: 'bg-blue-500', zohoVendorId: 'ZV001', commissionRate: 50, status: 'active' },
    { id: 3, name: 'Maria Santos', email: 'maria@easyservices.co.za', phone: '+27 83 234 5678', role: 'Agent', avatar: 'MS', color: 'bg-green-500', zohoVendorId: 'ZV002', commissionRate: 50, status: 'active' },
    { id: 4, name: 'David Kruger', email: 'david@easyservices.co.za', phone: '+27 84 345 6789', role: 'Agent', avatar: 'DK', color: 'bg-purple-500', zohoVendorId: 'ZV003', commissionRate: 50, status: 'active' },
  ];

  // Services imported from Zoho Books Items
  const services = [
    { id: 'SRV001', itemId: '1234567890001', name: 'Apostille - DIRCO', category: 'Apostille', rate: 850, description: 'Document apostille through DIRCO (3-4 weeks)', unit: 'per document', sku: 'APO-DIRCO' },
    { id: 'SRV002', itemId: '1234567890002', name: 'Apostille - High Court', category: 'Apostille', rate: 1200, description: 'Fast-track apostille through High Court (1-2 days)', unit: 'per document', sku: 'APO-HC' },
    { id: 'SRV003', itemId: '1234567890003', name: 'Notarial Certification', category: 'Notary', rate: 350, description: 'Certified true copy by Notary Public', unit: 'per document', sku: 'NOT-CERT' },
    { id: 'SRV004', itemId: '1234567890004', name: 'Affidavit Preparation', category: 'Notary', rate: 450, description: 'Draft and commission affidavit', unit: 'per affidavit', sku: 'NOT-AFF' },
    { id: 'SRV005', itemId: '1234567890005', name: 'Power of Attorney', category: 'Notary', rate: 650, description: 'General or Special Power of Attorney', unit: 'per document', sku: 'NOT-POA' },
    { id: 'SRV006', itemId: '1234567890006', name: 'Police Clearance', category: 'Document Procurement', rate: 450, description: 'SAPS Police Clearance Certificate application', unit: 'per application', sku: 'DOC-PCC' },
    { id: 'SRV007', itemId: '1234567890007', name: 'Birth Certificate', category: 'Document Procurement', rate: 350, description: 'Unabridged birth certificate from DHA', unit: 'per certificate', sku: 'DOC-BIRTH' },
    { id: 'SRV008', itemId: '1234567890008', name: 'Marriage Certificate', category: 'Document Procurement', rate: 350, description: 'Marriage certificate from DHA', unit: 'per certificate', sku: 'DOC-MARR' },
    { id: 'SRV009', itemId: '1234567890009', name: 'Death Certificate', category: 'Document Procurement', rate: 350, description: 'Death certificate from DHA', unit: 'per certificate', sku: 'DOC-DEATH' },
    { id: 'SRV010', itemId: '1234567890010', name: 'SAQA Verification', category: 'Document Procurement', rate: 550, description: 'SAQA qualification verification', unit: 'per qualification', sku: 'DOC-SAQA' },
    { id: 'SRV011', itemId: '1234567890011', name: 'Embassy Authentication', category: 'Authentication', rate: 950, description: 'Document authentication at embassy', unit: 'per document', sku: 'AUTH-EMB' },
    { id: 'SRV012', itemId: '1234567890012', name: 'Embassy Attestation', category: 'Authentication', rate: 750, description: 'Document attestation for non-Hague countries', unit: 'per document', sku: 'AUTH-ATT' },
    { id: 'SRV013', itemId: '1234567890013', name: 'Letter of No Impediment', category: 'Document Procurement', rate: 450, description: 'Letter confirming single status', unit: 'per letter', sku: 'DOC-LNI' },
    { id: 'SRV014', itemId: '1234567890014', name: 'Document Translation', category: 'Translation', rate: 250, description: 'Sworn translation per page', unit: 'per page', sku: 'TRANS-PAGE' },
    { id: 'SRV015', itemId: '1234567890015', name: 'Courier - Local', category: 'Courier', rate: 150, description: 'Local courier within South Africa', unit: 'per delivery', sku: 'COUR-LOC' },
    { id: 'SRV016', itemId: '1234567890016', name: 'Courier - International', category: 'Courier', rate: 850, description: 'DHL Express international shipping', unit: 'per delivery', sku: 'COUR-INT' },
    { id: 'SRV017', itemId: '1234567890017', name: 'Document Collection', category: 'Courier', rate: 200, description: 'Collection from client location', unit: 'per collection', sku: 'COUR-COLL' },
    { id: 'SRV018', itemId: '1234567890018', name: 'Consultation Fee', category: 'Consultation', rate: 500, description: 'Expert consultation (30 minutes)', unit: 'per session', sku: 'CONS-30' },
  ];

  const subjects = [
    'Apostille for birth certificate',
    'Quote request - Multiple documents',
    'Police clearance inquiry',
    'Document status update',
    'DIRCO processing time',
    'Marriage certificate authentication',
  ];

  const channels = ['whatsapp', 'email', 'form', 'chat'];
  const statuses = ['open', 'pending', 'resolved', 'closed'];
  const priorities = ['low', 'medium', 'high', 'urgent'];

  const tickets = [];
  for (let i = 1; i <= 12; i++) {
    const client = clients[Math.floor(Math.random() * clients.length)];
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const hoursAgo = Math.floor(Math.random() * 72);
    const assignedAgent = Math.random() > 0.4 ? agents[Math.floor(Math.random() * agents.length)] : null;
    
    tickets.push({
      id: `TKT-${String(1000 + i).padStart(4, '0')}`,
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      client,
      channel,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      createdAt: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
      unread: Math.random() > 0.5,
      assignedTo: assignedAgent,
      messages: [{ id: 1, sender: 'client', content: 'Hi, I need help with this request. Can you please advise on the process and costs?', timestamp: new Date(Date.now() - hoursAgo * 3600000).toISOString() }],
      tags: ['apostille'],
    });
  }
  return { tickets: tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), clients, agents, services };
};

const formatDate = (dateString) => {
  const diffMs = Date.now() - new Date(dateString);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const getChannelIcon = (ch) => ({ whatsapp: <Icons.WhatsApp />, email: <Icons.Email />, form: <Icons.Form />, chat: <Icons.Chat /> }[ch] || <Icons.Inbox />);
const getChannelColor = (ch) => ({ whatsapp: '#25D366', email: '#4285F4', form: '#FF9800', chat: '#9C27B0' }[ch] || '#666');
const getStatusColor = (s) => ({ open: '#2196F3', pending: '#FF9800', resolved: '#4CAF50', closed: '#9E9E9E' }[s] || '#666');
const getPriorityColor = (p) => ({ urgent: '#F44336', high: '#FF5722', medium: '#FF9800', low: '#4CAF50' }[p] || '#666');

export default function App() {
  const [activeView, setActiveView] = useState('inbox');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filter, setFilter] = useState('all');
  const [replyText, setReplyText] = useState('');
  const [data, setData] = useState(() => generateSampleData());
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null); // { type: 'ticket' | 'client', id: ... }
  const [showServiceBuilder, setShowServiceBuilder] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [serviceCart, setServiceCart] = useState([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [ticketPanelTab, setTicketPanelTab] = useState('details'); // 'details', 'quotes', 'invoices'
  const [editingClient, setEditingClient] = useState(false);
  const [editClientForm, setEditClientForm] = useState({ name: '', email: '', phone: '', company: '' });
  
  // Quotes & Invoices state
  const [invoiceTab, setInvoiceTab] = useState('all'); // 'all', 'quotes', 'invoices', 'bills'
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month', 'custom'
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [quotesAndInvoices, setQuotesAndInvoices] = useState([
    { type: 'quote', id: 'QT-001', client: 'James Mokoena', clientEmail: 'james@example.com', amount: 2500, status: 'pending', date: '2024-01-20', items: [{ name: 'Apostille - DIRCO', qty: 2, rate: 850 }, { name: 'Notarial Certification', qty: 2, rate: 400 }], assignedAgent: null, billId: null },
    { type: 'quote', id: 'QT-002', client: 'Sarah Nkosi', clientEmail: 'sarah.nkosi@gmail.com', amount: 850, status: 'accepted', date: '2024-01-19', items: [{ name: 'Apostille - DIRCO', qty: 1, rate: 850 }], assignedAgent: { id: 2, name: 'Sipho Ndlovu' }, billId: null },
    { type: 'invoice', id: 'INV-001', client: 'Sarah Nkosi', clientEmail: 'sarah.nkosi@gmail.com', amount: 850, status: 'paid', date: '2024-01-19', items: [{ name: 'Apostille - DIRCO', qty: 1, rate: 850 }], assignedAgent: { id: 2, name: 'Sipho Ndlovu' }, billId: 'BILL-001', billStatus: 'paid' },
    { type: 'quote', id: 'QT-003', client: 'TechFirm SA', clientEmail: 'm.chen@techfirm.com', amount: 5500, status: 'sent', date: '2024-01-18', items: [{ name: 'Embassy Authentication', qty: 4, rate: 950 }, { name: 'Courier - International', qty: 2, rate: 850 }], assignedAgent: { id: 3, name: 'Maria Santos' }, billId: null },
    { type: 'invoice', id: 'INV-002', client: 'Peter van der Berg', clientEmail: 'peter@bergcorp.co.za', amount: 3200, status: 'overdue', date: '2024-01-10', items: [{ name: 'Police Clearance', qty: 4, rate: 450 }, { name: 'Notarial Certification', qty: 4, rate: 350 }], assignedAgent: { id: 4, name: 'David Kruger' }, billId: 'BILL-002', billStatus: 'pending' },
    { type: 'invoice', id: 'INV-003', client: 'James Mokoena', clientEmail: 'james@example.com', amount: 1500, status: 'pending', date: '2024-01-15', items: [{ name: 'Apostille - High Court', qty: 1, rate: 1200 }, { name: 'Courier - Local', qty: 2, rate: 150 }], assignedAgent: { id: 2, name: 'Sipho Ndlovu' }, billId: 'BILL-003', billStatus: 'draft' },
    { type: 'quote', id: 'QT-004', client: 'Thandi Dlamini', clientEmail: 'thandi@outlook.com', amount: 1150, status: 'draft', date: '2024-01-21', items: [{ name: 'Birth Certificate', qty: 2, rate: 350 }, { name: 'Notarial Certification', qty: 1, rate: 350 }, { name: 'Courier - Local', qty: 1, rate: 150 }], assignedAgent: null, billId: null },
    { type: 'invoice', id: 'INV-004', client: 'TechFirm SA', clientEmail: 'm.chen@techfirm.com', amount: 2400, status: 'sent', date: '2024-01-17', items: [{ name: 'SAQA Verification', qty: 3, rate: 550 }, { name: 'Document Translation', qty: 3, rate: 250 }], assignedAgent: { id: 3, name: 'Maria Santos' }, billId: 'BILL-004', billStatus: 'sent' },
  ]);
  
  // Bills state (agent payments)
  const [bills, setBills] = useState([
    { id: 'BILL-001', invoiceId: 'INV-001', agent: { id: 2, name: 'Sipho Ndlovu', email: 'sipho@easyservices.co.za' }, amount: 425, status: 'paid', date: '2024-01-19', items: [{ name: 'Apostille - DIRCO', qty: 1, rate: 425 }] },
    { id: 'BILL-002', invoiceId: 'INV-002', agent: { id: 4, name: 'David Kruger', email: 'david@easyservices.co.za' }, amount: 1600, status: 'pending', date: '2024-01-10', items: [{ name: 'Police Clearance', qty: 4, rate: 225 }, { name: 'Notarial Certification', qty: 4, rate: 175 }] },
    { id: 'BILL-003', invoiceId: 'INV-003', agent: { id: 2, name: 'Sipho Ndlovu', email: 'sipho@easyservices.co.za' }, amount: 750, status: 'draft', date: '2024-01-15', items: [{ name: 'Apostille - High Court', qty: 1, rate: 600 }, { name: 'Courier - Local', qty: 2, rate: 75 }] },
    { id: 'BILL-004', invoiceId: 'INV-004', agent: { id: 3, name: 'Maria Santos', email: 'maria@easyservices.co.za' }, amount: 1200, status: 'sent', date: '2024-01-17', items: [{ name: 'SAQA Verification', qty: 3, rate: 275 }, { name: 'Document Translation', qty: 3, rate: 125 }] },
  ]);
  
  // Agent commission rates (50% of client rate by default)
  const getAgentRate = (clientRate) => Math.round(clientRate * 0.5);
  
  // Show agent assignment modal for invoices
  const [showInvoiceAgentModal, setShowInvoiceAgentModal] = useState(false);
  const [selectedInvoiceForAgent, setSelectedInvoiceForAgent] = useState(null);
  
  // Agent management state
  const [showImportAgentsModal, setShowImportAgentsModal] = useState(false);
  const [zohoVendors, setZohoVendors] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [showEditAgentModal, setShowEditAgentModal] = useState(false);
  const [selectedAgentForEdit, setSelectedAgentForEdit] = useState(null);
  const [agentForm, setAgentForm] = useState({ name: '', email: '', phone: '', role: 'Agent', commissionRate: 50 });
  
  // Simulated Zoho Books vendors (in production, fetch from API)
  const fetchZohoVendors = () => {
    setLoadingVendors(true);
    // Simulate API call
    setTimeout(() => {
      setZohoVendors([
        { vendor_id: 'ZV001', contact_name: 'Sipho Ndlovu', email: 'sipho@easyservices.co.za', phone: '+27 82 123 4567', company_name: 'Sipho Services', status: 'active', isAgent: data.agents.some(a => a.zohoVendorId === 'ZV001') },
        { vendor_id: 'ZV002', contact_name: 'Maria Santos', email: 'maria@easyservices.co.za', phone: '+27 83 234 5678', company_name: 'Santos Consulting', status: 'active', isAgent: data.agents.some(a => a.zohoVendorId === 'ZV002') },
        { vendor_id: 'ZV003', contact_name: 'David Kruger', email: 'david@easyservices.co.za', phone: '+27 84 345 6789', company_name: 'Kruger & Associates', status: 'active', isAgent: data.agents.some(a => a.zohoVendorId === 'ZV003') },
        { vendor_id: 'ZV004', contact_name: 'Thandi Molefe', email: 'thandi.molefe@gmail.com', phone: '+27 85 456 7890', company_name: null, status: 'active', isAgent: data.agents.some(a => a.zohoVendorId === 'ZV004') },
        { vendor_id: 'ZV005', contact_name: 'John Peterson', email: 'john.p@outlook.com', phone: '+27 86 567 8901', company_name: 'Peterson Docs', status: 'active', isAgent: data.agents.some(a => a.zohoVendorId === 'ZV005') },
        { vendor_id: 'ZV006', contact_name: 'Nomsa Zulu', email: 'nomsa.zulu@yahoo.com', phone: '+27 87 678 9012', company_name: null, status: 'active', isAgent: data.agents.some(a => a.zohoVendorId === 'ZV006') },
        { vendor_id: 'ZV007', contact_name: 'Office Supplies Co', email: 'orders@officesupplies.co.za', phone: '+27 11 123 4567', company_name: 'Office Supplies Co', status: 'active', isAgent: false },
        { vendor_id: 'ZV008', contact_name: 'DHL Shipping', email: 'accounts@dhl.co.za', phone: '+27 11 234 5678', company_name: 'DHL South Africa', status: 'active', isAgent: false },
      ]);
      setLoadingVendors(false);
    }, 800);
  };
  
  // Import selected vendors as agents
  const importSelectedVendors = () => {
    const newAgents = selectedVendors.map((vendorId, index) => {
      const vendor = zohoVendors.find(v => v.vendor_id === vendorId);
      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
      return {
        id: data.agents.length + index + 1,
        name: vendor.contact_name,
        email: vendor.email,
        phone: vendor.phone,
        role: 'Agent',
        avatar: vendor.contact_name.split(' ').map(n => n[0]).join(''),
        color: colors[(data.agents.length + index) % colors.length],
        zohoVendorId: vendor.vendor_id,
        commissionRate: 50,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
    });
    
    setData(prev => ({
      ...prev,
      agents: [...prev.agents, ...newAgents]
    }));
    
    setSelectedVendors([]);
    setShowImportAgentsModal(false);
    alert(`✓ ${newAgents.length} agent(s) imported from Zoho Books`);
  };

  const ticketCounts = {
    all: data.tickets.filter(t => t.status === 'open').length,
    whatsapp: data.tickets.filter(t => t.channel === 'whatsapp' && t.status === 'open').length,
    email: data.tickets.filter(t => t.channel === 'email' && t.status === 'open').length,
    form: data.tickets.filter(t => t.channel === 'form' && t.status === 'open').length,
    chat: data.tickets.filter(t => t.channel === 'chat' && t.status === 'open').length,
  };

  const getFilteredTickets = () => {
    let filtered = data.tickets;
    if (['whatsapp', 'email', 'form', 'chat'].includes(activeView)) {
      filtered = filtered.filter(t => t.channel === activeView);
    }
    if (filter !== 'all') filtered = filtered.filter(t => t.status === filter);
    return filtered;
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedTicket) return;
    const newMsg = { id: selectedTicket.messages.length + 1, sender: 'agent', content: replyText, timestamp: new Date().toISOString() };
    const updatedTicket = { ...selectedTicket, messages: [...selectedTicket.messages, newMsg] };
    setData({ ...data, tickets: data.tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t) });
    setSelectedTicket(updatedTicket);
    setReplyText('');
  };

  const menuItems = [
    { id: 'inbox', label: 'All Tickets', icon: Icons.Inbox, count: ticketCounts.all },
    { id: 'whatsapp', label: 'WhatsApp', icon: Icons.WhatsApp, count: ticketCounts.whatsapp },
    { id: 'email', label: 'Email', icon: Icons.Email, count: ticketCounts.email },
    { id: 'form', label: 'Web Forms', icon: Icons.Form, count: ticketCounts.form },
    { id: 'chat', label: 'SalesIQ Chat', icon: Icons.Chat, count: ticketCounts.chat },
  ];

  const secondaryItems = [
    { id: 'clients', label: 'Clients', icon: Icons.Users },
    { id: 'invoices', label: 'Quotes & Invoices', icon: Icons.Invoice },
    { id: 'agents', label: 'Agents', icon: Icons.UserCheck },
    { id: 'settings', label: 'Settings', icon: Icons.Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-slate-700 to-slate-600 rounded-lg flex items-center justify-center text-amber-500 font-bold text-sm">ES</div>
            <span className="text-lg font-bold">HelpDesk</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-5 mb-2">Channels</h3>
            {menuItems.map((item) => (
              <button key={item.id} onClick={() => { setActiveView(item.id); setSelectedTicket(null); }}
                className={`flex items-center gap-3 w-full px-5 py-2.5 text-sm transition-colors ${activeView === item.id ? 'bg-slate-800 text-white border-l-3 border-amber-500' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                <span style={{ color: item.id !== 'inbox' ? getChannelColor(item.id) : undefined }}><item.icon /></span>
                <span className="flex-1">{item.label}</span>
                {item.count > 0 && <span className="bg-amber-500 text-slate-900 text-xs font-semibold px-2 py-0.5 rounded-full">{item.count}</span>}
              </button>
            ))}
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-5 mb-2">Management</h3>
            {secondaryItems.map((item) => (
              <button key={item.id} onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-3 w-full px-5 py-2.5 text-sm transition-colors ${activeView === item.id ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                <item.icon /><span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 text-slate-900 rounded-full flex items-center justify-center text-xs font-semibold">AD</div>
            <div><div className="text-sm font-medium">Admin User</div><div className="text-xs text-slate-400">Administrator</div></div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {['inbox', 'whatsapp', 'email', 'form', 'chat'].includes(activeView) ? (
          <div className="flex flex-1 overflow-hidden">
            {/* Ticket List */}
            <div className="w-96 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg mb-3">
                  <Icons.Search /><input type="text" placeholder="Search tickets..." className="flex-1 bg-transparent border-none outline-none text-sm" />
                </div>
                <div className="flex gap-1">
                  {['all', 'open', 'pending', 'resolved'].map((s) => (
                    <button key={s} onClick={() => setFilter(s)}
                      className={`px-3 py-1.5 rounded text-sm transition-colors ${filter === s ? 'bg-slate-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {getFilteredTickets().map((ticket) => (
                  <div key={ticket.id} onClick={() => { setSelectedTicket(ticket); setTicketPanelTab('details'); setEditingClient(false); }}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${selectedTicket?.id === ticket.id ? 'bg-slate-50 border-l-3 border-slate-800' : 'hover:bg-gray-50'} ${ticket.unread ? 'bg-amber-50' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span style={{ color: getChannelColor(ticket.channel) }}>{getChannelIcon(ticket.channel)}</span>
                      <span className="text-xs text-gray-400">{ticket.id}</span>
                      <span className="ml-auto text-xs text-gray-400">{formatDate(ticket.createdAt)}</span>
                    </div>
                    <h4 className={`text-sm mb-1 truncate ${ticket.unread ? 'font-semibold' : ''}`}>{ticket.subject}</h4>
                    <p className="text-sm text-gray-500">{ticket.client.name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: getStatusColor(ticket.status) }}>{ticket.status}</span>
                      <span className="text-xs font-medium" style={{ color: getPriorityColor(ticket.priority) }}>{ticket.priority}</span>
                      {ticket.assignedTo && (
                        <span className="ml-auto flex items-center gap-1 text-xs text-gray-500">
                          <span className={`w-5 h-5 ${ticket.assignedTo.color} text-white rounded-full flex items-center justify-center text-[10px] font-medium`}>{ticket.assignedTo.avatar}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ticket Detail */}
            {selectedTicket ? (
              <div className="flex-1 flex flex-col overflow-hidden bg-white">
                <div className="flex items-start justify-between p-5 border-b border-gray-200">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: getChannelColor(selectedTicket.channel) }}>
                        {getChannelIcon(selectedTicket.channel)}{selectedTicket.channel}
                      </span>
                      <h2 className="text-lg font-semibold">{selectedTicket.subject}</h2>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{selectedTicket.id}</span><span>•</span><span>Created {formatDate(selectedTicket.createdAt)}</span><span>•</span>
                      <span style={{ color: getPriorityColor(selectedTicket.priority) }}>{selectedTicket.priority} priority</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select defaultValue={selectedTicket.status} className="px-3 py-2 border-2 rounded-lg text-sm font-medium" style={{ borderColor: getStatusColor(selectedTicket.status) }}>
                      <option value="open">Open</option><option value="pending">Pending</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
                    </select>
                    <button onClick={() => { setAssignTarget({ type: 'ticket', id: selectedTicket.id }); setShowAgentModal(true); }}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:border-slate-800">
                      {selectedTicket.assignedTo ? (
                        <>
                          <span className={`w-6 h-6 ${selectedTicket.assignedTo.color} text-white rounded-full flex items-center justify-center text-xs font-medium`}>{selectedTicket.assignedTo.avatar}</span>
                          <span>{selectedTicket.assignedTo.name}</span>
                        </>
                      ) : (
                        <>
                          <Icons.UserCheck />
                          <span>Assign</span>
                        </>
                      )}
                    </button>
                    <div className="relative">
                      <button onClick={() => setShowDropdown(!showDropdown)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100"><Icons.MoreVertical /></button>
                      {showDropdown && (
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <button onClick={() => { setActiveView('clients'); setShowDropdown(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50"><Icons.Users />View Client</button>
                          <button onClick={() => { alert('Merge with another ticket'); setShowDropdown(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-gray-50"><Icons.Inbox />Merge Ticket</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1 overflow-y-auto p-6">
                      {selectedTicket.messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-3 mb-5 ${msg.sender === 'agent' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${msg.sender === 'client' ? 'bg-gray-200 text-gray-600' : 'bg-amber-500 text-slate-900'}`}>
                            {msg.sender === 'client' ? selectedTicket.client.name.charAt(0) : 'A'}
                          </div>
                          <div className={`max-w-[70%] ${msg.sender === 'agent' ? 'text-right' : ''}`}>
                            <div className={`flex items-center gap-2 mb-1 ${msg.sender === 'agent' ? 'justify-end' : ''}`}>
                              <span className="font-medium text-sm">{msg.sender === 'client' ? selectedTicket.client.name : 'You'}</span>
                              <span className="text-xs text-gray-400">{formatDate(msg.timestamp)}</span>
                            </div>
                            <p className={`px-4 py-3 rounded-xl text-sm ${msg.sender === 'client' ? 'bg-gray-100 text-gray-800 rounded-bl-sm' : 'bg-slate-800 text-white rounded-br-sm'}`}>{msg.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                      <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your reply..." 
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20 outline-none focus:border-slate-800 text-sm"
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); }}} />
                      <div className="flex justify-between items-center mt-3">
                        <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100"><Icons.Paperclip /></button>
                        <button onClick={handleSendReply} disabled={!replyText.trim()}
                          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed">
                          <Icons.Send />Send
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Client Panel with Tabs */}
                  <div className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col flex-shrink-0 overflow-hidden">
                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
                      {[
                        { id: 'details', label: 'Details', icon: <Icons.Users /> },
                        { id: 'quotes', label: 'Quotes', icon: <Icons.FileText /> },
                        { id: 'invoices', label: 'Invoices', icon: <Icons.Invoice /> }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setTicketPanelTab(tab.id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-all ${
                            ticketPanelTab === tab.id
                              ? 'text-slate-800 border-b-2 border-slate-800 bg-gray-50'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {tab.icon}
                          {tab.label}
                          {tab.id === 'quotes' && (
                            <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                              {quotesAndInvoices.filter(q => q.type === 'quote' && q.client === selectedTicket.client.name).length}
                            </span>
                          )}
                          {tab.id === 'invoices' && (
                            <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                              {quotesAndInvoices.filter(q => q.type === 'invoice' && q.client === selectedTicket.client.name).length}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
                      {/* Details Tab */}
                      {ticketPanelTab === 'details' && (
                        <>
                          <div className="p-5 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Client Information</h3>
                              {!editingClient && (
                                <button 
                                  onClick={() => {
                                    setEditClientForm({
                                      name: selectedTicket.client.name,
                                      email: selectedTicket.client.email,
                                      phone: selectedTicket.client.phone,
                                      company: selectedTicket.client.company || ''
                                    });
                                    setEditingClient(true);
                                  }}
                                  className="text-xs text-slate-600 hover:text-slate-800 flex items-center gap-1"
                                >
                                  <Icons.Settings /> Edit
                                </button>
                              )}
                            </div>
                            
                            {editingClient ? (
                              /* Edit Mode */
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                                  <input
                                    type="text"
                                    value={editClientForm.name}
                                    onChange={(e) => setEditClientForm({ ...editClientForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Company</label>
                                  <input
                                    type="text"
                                    value={editClientForm.company}
                                    onChange={(e) => setEditClientForm({ ...editClientForm, company: e.target.value })}
                                    placeholder="Optional"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                                  <input
                                    type="email"
                                    value={editClientForm.email}
                                    onChange={(e) => setEditClientForm({ ...editClientForm, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                                  <input
                                    type="tel"
                                    value={editClientForm.phone}
                                    onChange={(e) => setEditClientForm({ ...editClientForm, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                  />
                                </div>
                                <div className="flex gap-2 pt-2">
                                  <button
                                    onClick={() => {
                                      // Update client in ticket
                                      const updatedClient = {
                                        ...selectedTicket.client,
                                        name: editClientForm.name,
                                        email: editClientForm.email,
                                        phone: editClientForm.phone,
                                        company: editClientForm.company
                                      };
                                      const updatedTicket = { ...selectedTicket, client: updatedClient };
                                      
                                      // Update in data.tickets
                                      setData(prev => ({
                                        ...prev,
                                        tickets: prev.tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t),
                                        clients: prev.clients.map(c => c.id === selectedTicket.client.id ? updatedClient : c)
                                      }));
                                      
                                      // Update selected ticket
                                      setSelectedTicket(updatedTicket);
                                      
                                      // Update quotes/invoices with new client name
                                      setQuotesAndInvoices(prev => prev.map(item => 
                                        item.client === selectedTicket.client.name 
                                          ? { ...item, client: editClientForm.name, clientEmail: editClientForm.email }
                                          : item
                                      ));
                                      
                                      setEditingClient(false);
                                    }}
                                    className="flex-1 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingClient(false)}
                                    className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* View Mode */
                              <>
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-12 h-12 bg-slate-800 text-amber-500 rounded-full flex items-center justify-center text-base font-semibold">
                                    {selectedTicket.client.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{selectedTicket.client.name}</h4>
                                    {selectedTicket.client.company && <p className="text-sm text-gray-500">{selectedTicket.client.company}</p>}
                                  </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Icons.Email />
                                    <a href={`mailto:${selectedTicket.client.email}`} className="hover:underline">{selectedTicket.client.email}</a>
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <Icons.WhatsApp />
                                    {selectedTicket.client.phone}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                          <div className="p-5 border-b border-gray-200">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Quick Actions</h3>
                            <div className="space-y-2">
                              <button 
                                onClick={() => { 
                                  setSelectedClient(selectedTicket.client); 
                                  setServiceCart([]); 
                                  setServiceSearch('');
                                  setSelectedCategory('All');
                                  setShowServiceBuilder(true); 
                                }} 
                                className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg text-sm font-medium hover:from-amber-600 hover:to-amber-700 transition-all shadow-sm">
                                <Icons.Plus />Add Services
                              </button>
                              <button onClick={() => { setAssignTarget({ type: 'ticket', id: selectedTicket.id }); setShowAgentModal(true); }} className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-gray-300 rounded-lg text-sm hover:border-slate-800 hover:text-slate-800 transition-colors"><Icons.UserCheck />Assign to Agent</button>
                            </div>
                          </div>
                          <div className="p-5">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedTicket.tags.map((tag, i) => <span key={i} className="px-2.5 py-1 bg-gray-200 rounded-full text-xs text-gray-600">{tag}</span>)}
                              <button className="w-7 h-7 border border-dashed border-gray-300 rounded-full flex items-center justify-center text-gray-400 hover:border-slate-800 hover:text-slate-800"><Icons.Plus /></button>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Quotes Tab */}
                      {ticketPanelTab === 'quotes' && (
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-700">Client Quotes</h3>
                            <button 
                              onClick={() => { 
                                setSelectedClient(selectedTicket.client); 
                                setServiceCart([]); 
                                setServiceSearch('');
                                setSelectedCategory('All');
                                setShowServiceBuilder(true); 
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600"
                            >
                              <Icons.Plus /> New Quote
                            </button>
                          </div>
                          
                          {quotesAndInvoices.filter(q => q.type === 'quote' && q.client === selectedTicket.client.name).length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                                <Icons.FileText />
                              </div>
                              <p className="text-sm font-medium text-gray-500">No quotes yet</p>
                              <p className="text-xs mt-1">Create a quote using Add Services</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {quotesAndInvoices
                                .filter(q => q.type === 'quote' && q.client === selectedTicket.client.name)
                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                .map(quote => (
                                  <div key={quote.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-sm text-amber-600">{quote.id}</span>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        quote.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                        quote.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                                        quote.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                                        'bg-amber-100 text-amber-700'
                                      }`}>
                                        {quote.status}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2">{quote.date}</div>
                                    <div className="space-y-1 mb-2">
                                      {quote.items.slice(0, 2).map((item, i) => (
                                        <div key={i} className="text-xs text-gray-600 flex justify-between">
                                          <span>{item.name} × {item.qty}</span>
                                          <span>R{(item.rate * item.qty).toLocaleString()}</span>
                                        </div>
                                      ))}
                                      {quote.items.length > 2 && (
                                        <div className="text-xs text-gray-400">+{quote.items.length - 2} more items</div>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                      <span className="font-semibold text-sm">R{quote.amount.toLocaleString()}</span>
                                      <div className="flex gap-1">
                                        {quote.status === 'draft' && (
                                          <button className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">Send</button>
                                        )}
                                        {quote.status !== 'accepted' && (
                                          <button 
                                            onClick={() => {
                                              // Convert to invoice
                                              const newInvoiceId = `INV-${String(quotesAndInvoices.filter(i => i.type === 'invoice').length + 1).padStart(3, '0')}`;
                                              setQuotesAndInvoices(prev => [
                                                ...prev.filter(q => q.id !== quote.id),
                                                { ...quote, type: 'invoice', id: newInvoiceId, status: 'pending' }
                                              ]);
                                              alert(`✓ Converted to Invoice ${newInvoiceId}`);
                                            }}
                                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                          >
                                            → Invoice
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Invoices Tab */}
                      {ticketPanelTab === 'invoices' && (
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-700">Client Invoices</h3>
                            <button 
                              onClick={() => { 
                                setSelectedClient(selectedTicket.client); 
                                setServiceCart([]); 
                                setServiceSearch('');
                                setSelectedCategory('All');
                                setShowServiceBuilder(true); 
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
                            >
                              <Icons.Plus /> New Invoice
                            </button>
                          </div>
                          
                          {quotesAndInvoices.filter(q => q.type === 'invoice' && q.client === selectedTicket.client.name).length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                                <Icons.Invoice />
                              </div>
                              <p className="text-sm font-medium text-gray-500">No invoices yet</p>
                              <p className="text-xs mt-1">Create an invoice using Add Services</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {quotesAndInvoices
                                .filter(q => q.type === 'invoice' && q.client === selectedTicket.client.name)
                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                .map(invoice => (
                                  <div key={invoice.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-sm text-green-600">{invoice.id}</span>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                                        invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                        invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                                        'bg-amber-100 text-amber-700'
                                      }`}>
                                        {invoice.status}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2">{invoice.date}</div>
                                    <div className="space-y-1 mb-2">
                                      {invoice.items.slice(0, 2).map((item, i) => (
                                        <div key={i} className="text-xs text-gray-600 flex justify-between">
                                          <span>{item.name} × {item.qty}</span>
                                          <span>R{(item.rate * item.qty).toLocaleString()}</span>
                                        </div>
                                      ))}
                                      {invoice.items.length > 2 && (
                                        <div className="text-xs text-gray-400">+{invoice.items.length - 2} more items</div>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                      <span className="font-semibold text-sm">R{invoice.amount.toLocaleString()}</span>
                                      <div className="flex gap-1">
                                        {invoice.status === 'pending' && (
                                          <button 
                                            onClick={() => {
                                              setQuotesAndInvoices(prev => prev.map(inv => 
                                                inv.id === invoice.id ? { ...inv, status: 'sent' } : inv
                                              ));
                                              alert(`✓ Invoice ${invoice.id} sent to ${invoice.clientEmail}`);
                                            }}
                                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                          >
                                            Send
                                          </button>
                                        )}
                                        {invoice.status !== 'paid' && (
                                          <button 
                                            onClick={() => {
                                              setQuotesAndInvoices(prev => prev.map(inv => 
                                                inv.id === invoice.id ? { ...inv, status: 'paid' } : inv
                                              ));
                                              alert(`✓ Invoice ${invoice.id} marked as paid`);
                                            }}
                                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                          >
                                            Paid
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    {invoice.assignedAgent && (
                                      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                                        <Icons.UserCheck />
                                        <span>Agent: {invoice.assignedAgent.name}</span>
                                        {invoice.billId && (
                                          <span className="ml-auto text-purple-600">Bill: {invoice.billId}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-white">
                <div className="text-center text-gray-400">
                  <Icons.Inbox /><h3 className="text-lg font-medium text-gray-600 mt-4 mb-2">Select a ticket</h3><p>Choose a ticket from the list to view details</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 bg-white border-b border-gray-200">
              <h1 className="text-2xl font-semibold">{activeView.charAt(0).toUpperCase() + activeView.slice(1)}</h1>
            </div>
            <div className="p-6">
              {activeView === 'clients' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.clients.map(client => (
                    <div key={client.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-slate-800 hover:shadow-md transition-all">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-slate-800 text-amber-500 rounded-full flex items-center justify-center text-lg font-semibold">{client.name.split(' ').map(n => n[0]).join('')}</div>
                        <div><h3 className="font-semibold">{client.name}</h3>{client.company && <p className="text-sm text-gray-500">{client.company}</p>}</div>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2"><Icons.Email />{client.email}</div>
                        <div className="flex items-center gap-2"><Icons.WhatsApp />{client.phone}</div>
                      </div>
                      <div className="flex gap-6 pt-4 border-t border-gray-100 mb-4">
                        <div className="text-center"><div className="text-xl font-semibold text-slate-800">{data.tickets.filter(t => t.client.id === client.id).length}</div><div className="text-xs text-gray-500">Tickets</div></div>
                        <div className="text-center"><div className="text-xl font-semibold text-slate-800">{data.tickets.filter(t => t.client.id === client.id && t.status === 'open').length}</div><div className="text-xs text-gray-500">Open</div></div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setAssignTarget({ type: 'client', id: client.id, name: client.name }); setShowAgentModal(true); }} 
                          className="flex items-center justify-center gap-2 flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:border-slate-800 transition-colors">
                          <Icons.UserCheck />Assign
                        </button>
                        <button onClick={() => { setActiveView('inbox'); setSelectedTicket(data.tickets.find(t => t.client.id === client.id)); setTicketPanelTab('details'); setEditingClient(false); }} 
                          className="flex items-center justify-center gap-2 flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:border-slate-800 transition-colors">
                          <Icons.Inbox />Tickets
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {activeView === 'invoices' && (
                <div>
                  {/* Header with Tabs and Date Filter */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    {/* Tabs for Quotes, Invoices, and Bills */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setInvoiceTab('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${invoiceTab === 'all' ? 'bg-slate-800 text-white' : 'bg-white border border-gray-300 hover:border-slate-800'}`}>
                        All
                      </button>
                      <button 
                        onClick={() => setInvoiceTab('quotes')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${invoiceTab === 'quotes' ? 'bg-amber-500 text-white' : 'bg-white border border-gray-300 hover:border-amber-500'}`}>
                        Quotes
                      </button>
                      <button 
                        onClick={() => setInvoiceTab('invoices')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${invoiceTab === 'invoices' ? 'bg-green-600 text-white' : 'bg-white border border-gray-300 hover:border-green-600'}`}>
                        Invoices
                      </button>
                      <button 
                        onClick={() => setInvoiceTab('bills')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${invoiceTab === 'bills' ? 'bg-purple-600 text-white' : 'bg-white border border-gray-300 hover:border-purple-600'}`}>
                        <Icons.Receipt />
                        Agent Bills
                      </button>
                    </div>
                    
                    {/* Date Filter */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Icons.Calendar />
                        <span className="text-sm">Filter:</span>
                      </div>
                      <select 
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
                      >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="custom">Custom Range</option>
                      </select>
                      {dateFilter === 'custom' && (
                        <div className="flex items-center gap-2">
                          <input 
                            type="date" 
                            value={customDateFrom}
                            onChange={(e) => setCustomDateFrom(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
                          />
                          <span className="text-gray-400">to</span>
                          <input 
                            type="date" 
                            value={customDateTo}
                            onChange={(e) => setCustomDateTo(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Stats - Conditional based on tab */}
                  {invoiceTab === 'bills' ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <h4 className="text-sm text-gray-500 mb-2">Total Bills</h4>
                        <p className="text-2xl font-semibold text-purple-600">{bills.length}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <h4 className="text-sm text-gray-500 mb-2">Bills Pending</h4>
                        <p className="text-2xl font-semibold text-amber-500">
                          R {bills.filter(b => ['draft', 'pending', 'sent'].includes(b.status)).reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <h4 className="text-sm text-gray-500 mb-2">Bills Paid</h4>
                        <p className="text-2xl font-semibold text-green-500">
                          R {bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <h4 className="text-sm text-gray-500 mb-2">Agent Commission Rate</h4>
                        <p className="text-2xl font-semibold">50%</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <h4 className="text-sm text-gray-500 mb-2">Quotes Pending</h4>
                        <p className="text-2xl font-semibold text-amber-500">
                          {quotesAndInvoices.filter(i => i.type === 'quote' && ['draft', 'pending', 'sent'].includes(i.status)).length}
                        </p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <h4 className="text-sm text-gray-500 mb-2">Quotes Accepted</h4>
                        <p className="text-2xl font-semibold text-green-500">
                          R {quotesAndInvoices.filter(i => i.type === 'quote' && i.status === 'accepted').reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <h4 className="text-sm text-gray-500 mb-2">Invoices Outstanding</h4>
                        <p className="text-2xl font-semibold">
                          R {quotesAndInvoices.filter(i => i.type === 'invoice' && ['pending', 'sent'].includes(i.status)).reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <h4 className="text-sm text-gray-500 mb-2">Overdue</h4>
                        <p className="text-2xl font-semibold text-red-500">
                          R {quotesAndInvoices.filter(i => i.type === 'invoice' && i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Bills Table */}
                  {invoiceTab === 'bills' ? (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Bill #</th>
                            <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Linked Invoice</th>
                            <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Agent</th>
                            <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Amount</th>
                            <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Status</th>
                            <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Date</th>
                            <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bills
                            .filter(bill => {
                              if (dateFilter !== 'all') {
                                const billDate = new Date(bill.date);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                if (dateFilter === 'today') {
                                  const billDay = new Date(bill.date);
                                  billDay.setHours(0, 0, 0, 0);
                                  if (billDay.getTime() !== today.getTime()) return false;
                                } else if (dateFilter === 'week') {
                                  const weekAgo = new Date(today);
                                  weekAgo.setDate(weekAgo.getDate() - 7);
                                  if (billDate < weekAgo) return false;
                                } else if (dateFilter === 'month') {
                                  const monthAgo = new Date(today);
                                  monthAgo.setMonth(monthAgo.getMonth() - 1);
                                  if (billDate < monthAgo) return false;
                                } else if (dateFilter === 'custom' && customDateFrom && customDateTo) {
                                  const from = new Date(customDateFrom);
                                  const to = new Date(customDateTo);
                                  to.setHours(23, 59, 59, 999);
                                  if (billDate < from || billDate > to) return false;
                                }
                              }
                              return true;
                            })
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map(bill => (
                            <tr key={bill.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="p-4">
                                <span className="flex items-center gap-1.5 text-sm text-purple-600 font-medium">
                                  <Icons.Receipt />
                                  {bill.id}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="flex items-center gap-1.5 text-sm text-green-600">
                                  <Icons.Link />
                                  {bill.invoiceId}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                                    {bill.agent.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{bill.agent.name}</p>
                                    <p className="text-xs text-gray-500">{bill.agent.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 font-medium">R {bill.amount.toLocaleString()}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                  bill.status === 'paid' ? 'bg-green-100 text-green-700' : 
                                  bill.status === 'sent' || bill.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                                  'bg-gray-100 text-gray-600'
                                }`}>{bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}</span>
                              </td>
                              <td className="p-4 text-gray-500">{bill.date}</td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => {
                                      const itemsList = bill.items.map(i => `  • ${i.name} × ${i.qty} = R${(i.rate * i.qty).toLocaleString()}`).join('\n');
                                      const linkedInvoice = quotesAndInvoices.find(inv => inv.id === bill.invoiceId);
                                      alert(`Bill ${bill.id}\n\nAgent: ${bill.agent.name}\nEmail: ${bill.agent.email}\nLinked Invoice: ${bill.invoiceId}\nClient: ${linkedInvoice?.client || 'N/A'}\nStatus: ${bill.status}\nDate: ${bill.date}\n\nServices (Agent Commission 50%):\n${itemsList}\n\nTotal Payable: R${bill.amount.toLocaleString()}`);
                                    }}
                                    className="p-2 text-gray-500 hover:text-slate-800 hover:bg-gray-100 rounded transition-colors"
                                    title="View Details"
                                  >
                                    <Icons.Eye />
                                  </button>
                                  {bill.status !== 'paid' && bill.status !== 'sent' && (
                                    <button 
                                      onClick={() => {
                                        const confirmed = confirm(`Send Bill ${bill.id} to ${bill.agent.name}?\n\nEmail: ${bill.agent.email}\nAmount: R${bill.amount.toLocaleString()}`);
                                        if (confirmed) {
                                          setBills(prev => prev.map(b => b.id === bill.id ? { ...b, status: 'sent' } : b));
                                          setQuotesAndInvoices(prev => prev.map(inv => 
                                            inv.billId === bill.id ? { ...inv, billStatus: 'sent' } : inv
                                          ));
                                          alert(`✓ Bill ${bill.id} sent to ${bill.agent.email}`);
                                        }
                                      }}
                                      className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                                    >
                                      Send
                                    </button>
                                  )}
                                  {bill.status !== 'paid' && (
                                    <button 
                                      onClick={() => {
                                        const confirmed = confirm(`Mark Bill ${bill.id} as paid?\n\nAgent: ${bill.agent.name}\nAmount: R${bill.amount.toLocaleString()}`);
                                        if (confirmed) {
                                          setBills(prev => prev.map(b => b.id === bill.id ? { ...b, status: 'paid' } : b));
                                          setQuotesAndInvoices(prev => prev.map(inv => 
                                            inv.billId === bill.id ? { ...inv, billStatus: 'paid' } : inv
                                          ));
                                          alert(`✓ Bill ${bill.id} marked as paid`);
                                        }
                                      }}
                                      className="px-3 py-1.5 text-xs border border-green-600 text-green-600 rounded hover:bg-green-50 transition-colors"
                                    >
                                      Paid
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {bills.length === 0 && (
                        <div className="p-12 text-center text-gray-400">
                          <Icons.Receipt />
                          <p className="mt-3">No agent bills found</p>
                          <p className="text-sm mt-1">Bills are created when agents are assigned to invoices</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Quotes & Invoices Table */
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Type</th>
                            <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Number</th>
                            <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Client</th>
                            <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Amount</th>
                            <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Agent</th>
                            <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Bill</th>
                            <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Status</th>
                            <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Date</th>
                            <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quotesAndInvoices
                            .filter(item => {
                              // Filter by type
                              if (invoiceTab === 'quotes' && item.type !== 'quote') return false;
                              if (invoiceTab === 'invoices' && item.type !== 'invoice') return false;
                              
                              // Filter by date
                              if (dateFilter !== 'all') {
                                const itemDate = new Date(item.date);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                
                                if (dateFilter === 'today') {
                                  const itemDay = new Date(item.date);
                                  itemDay.setHours(0, 0, 0, 0);
                                  if (itemDay.getTime() !== today.getTime()) return false;
                                } else if (dateFilter === 'week') {
                                  const weekAgo = new Date(today);
                                  weekAgo.setDate(weekAgo.getDate() - 7);
                                  if (itemDate < weekAgo) return false;
                                } else if (dateFilter === 'month') {
                                  const monthAgo = new Date(today);
                                  monthAgo.setMonth(monthAgo.getMonth() - 1);
                                  if (itemDate < monthAgo) return false;
                                } else if (dateFilter === 'custom' && customDateFrom && customDateTo) {
                                  const from = new Date(customDateFrom);
                                  const to = new Date(customDateTo);
                                  to.setHours(23, 59, 59, 999);
                                  if (itemDate < from || itemDate > to) return false;
                                }
                              }
                              return true;
                            })
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map(item => (
                            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="p-4">
                                <span className={`flex items-center gap-1.5 text-sm ${item.type === 'quote' ? 'text-amber-600' : 'text-green-600'}`}>
                                  {item.type === 'quote' ? <Icons.FileText /> : <Icons.Invoice />}
                                  {item.type === 'quote' ? 'Quote' : 'Invoice'}
                                </span>
                              </td>
                              <td className="p-4 font-medium">{item.id}</td>
                              <td className="p-4">
                                <div>
                                  <p className="font-medium">{item.client}</p>
                                  <p className="text-xs text-gray-500">{item.clientEmail}</p>
                                </div>
                              </td>
                              <td className="p-4 font-medium">R {item.amount.toLocaleString()}</td>
                              {/* Agent Column */}
                              <td className="p-4">
                                {item.assignedAgent ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                                      {item.assignedAgent.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <span className="text-sm">{item.assignedAgent.name.split(' ')[0]}</span>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => {
                                      setSelectedInvoiceForAgent(item);
                                      setShowInvoiceAgentModal(true);
                                    }}
                                    className="text-xs text-purple-600 hover:text-purple-800 hover:underline"
                                  >
                                    + Assign
                                  </button>
                                )}
                              </td>
                              {/* Bill Column */}
                              <td className="p-4">
                                {item.type === 'invoice' && item.billId ? (
                                  <div className="flex items-center gap-1.5">
                                    <Icons.Link />
                                    <span className="text-xs font-medium text-purple-600">{item.billId}</span>
                                    <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                                      item.billStatus === 'paid' ? 'bg-green-100 text-green-700' : 
                                      item.billStatus === 'sent' ? 'bg-amber-100 text-amber-700' : 
                                      'bg-gray-100 text-gray-600'
                                    }`}>{item.billStatus}</span>
                                  </div>
                                ) : item.type === 'invoice' && item.assignedAgent && !item.billId ? (
                                  <button 
                                    onClick={() => {
                                      const newBillId = `BILL-${String(bills.length + 1).padStart(3, '0')}`;
                                      const billItems = item.items.map(i => ({
                                        name: i.name,
                                        qty: i.qty,
                                        rate: getAgentRate(i.rate)
                                      }));
                                      const billAmount = billItems.reduce((sum, i) => sum + (i.qty * i.rate), 0);
                                      
                                      const agent = data.agents.find(a => a.id === item.assignedAgent.id);
                                      
                                      setBills(prev => [...prev, {
                                        id: newBillId,
                                        invoiceId: item.id,
                                        agent: { id: agent.id, name: agent.name, email: agent.email },
                                        amount: billAmount,
                                        status: 'draft',
                                        date: new Date().toISOString().split('T')[0],
                                        items: billItems
                                      }]);
                                      
                                      setQuotesAndInvoices(prev => prev.map(inv => 
                                        inv.id === item.id ? { ...inv, billId: newBillId, billStatus: 'draft' } : inv
                                      ));
                                      
                                      alert(`✓ Bill ${newBillId} created for ${agent.name}\n\nAmount: R${billAmount.toLocaleString()} (50% commission)\n\nGo to Agent Bills tab to send it.`);
                                    }}
                                    className="text-xs text-purple-600 hover:text-purple-800 hover:underline"
                                  >
                                    + Create Bill
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                  item.status === 'paid' || item.status === 'accepted' ? 'bg-green-100 text-green-700' : 
                                  item.status === 'pending' || item.status === 'sent' ? 'bg-amber-100 text-amber-700' : 
                                  item.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                                  'bg-red-100 text-red-700'
                                }`}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span>
                              </td>
                              <td className="p-4 text-gray-500">{item.date}</td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  {/* View Details */}
                                  <button 
                                    onClick={() => {
                                      const itemsList = item.items.map(i => `  • ${i.name} × ${i.qty} = R${(i.rate * i.qty).toLocaleString()}`).join('\n');
                                      const agentInfo = item.assignedAgent ? `\nAssigned Agent: ${item.assignedAgent.name}` : '';
                                      const billInfo = item.billId ? `\nLinked Bill: ${item.billId} (${item.billStatus})` : '';
                                      alert(`${item.type === 'quote' ? 'Quote' : 'Invoice'} ${item.id}\n\nClient: ${item.client}\nEmail: ${item.clientEmail}\nStatus: ${item.status}\nDate: ${item.date}${agentInfo}${billInfo}\n\nItems:\n${itemsList}\n\nTotal: R${item.amount.toLocaleString()}`);
                                    }}
                                    className="p-2 text-gray-500 hover:text-slate-800 hover:bg-gray-100 rounded transition-colors"
                                    title="View Details"
                                  >
                                    <Icons.Eye />
                                  </button>
                                  
                                  {/* Send Button */}
                                  {item.status !== 'paid' && item.status !== 'accepted' && (
                                    <button 
                                      onClick={() => {
                                        const confirmed = confirm(`Send ${item.type} ${item.id} to ${item.client}?\n\nEmail: ${item.clientEmail}\nAmount: R${item.amount.toLocaleString()}`);
                                        if (confirmed) {
                                          setQuotesAndInvoices(prev => prev.map(i => 
                                            i.id === item.id ? { ...i, status: 'sent' } : i
                                          ));
                                          alert(`✓ ${item.type === 'quote' ? 'Quote' : 'Invoice'} ${item.id} sent to ${item.clientEmail}`);
                                        }
                                      }}
                                      className="px-3 py-1.5 text-xs bg-slate-800 text-white rounded hover:bg-slate-900 transition-colors"
                                    >
                                      Send
                                    </button>
                                  )}
                                  
                                  {/* Convert Quote to Invoice */}
                                  {item.type === 'quote' && item.status !== 'accepted' && (
                                    <button 
                                      onClick={() => {
                                        const confirmed = confirm(`Convert Quote ${item.id} to Invoice?\n\nClient: ${item.client}\nAmount: R${item.amount.toLocaleString()}\n\nThis will:\n1. Mark the quote as accepted\n2. Create a new invoice in Zoho Books\n3. Copy agent assignment if set`);
                                        if (confirmed) {
                                          setQuotesAndInvoices(prev => {
                                            const updated = prev.map(i => 
                                              i.id === item.id ? { ...i, status: 'accepted' } : i
                                            );
                                            const newInvoiceId = `INV-${String(prev.filter(i => i.type === 'invoice').length + 1).padStart(3, '0')}`;
                                            updated.push({
                                              type: 'invoice',
                                              id: newInvoiceId,
                                              client: item.client,
                                              clientEmail: item.clientEmail,
                                              amount: item.amount,
                                              status: 'pending',
                                              date: new Date().toISOString().split('T')[0],
                                              items: item.items,
                                              fromQuote: item.id,
                                              assignedAgent: item.assignedAgent,
                                              billId: null,
                                              billStatus: null
                                            });
                                            return updated;
                                          });
                                          alert(`✓ Quote ${item.id} converted to invoice\n\nNew invoice created and ready to send.${item.assignedAgent ? '\nAgent assignment copied - you can create the agent bill.' : ''}`);
                                        }
                                      }}
                                      className="flex items-center gap-1 px-3 py-1.5 text-xs border border-green-600 text-green-600 rounded hover:bg-green-50 transition-colors"
                                    >
                                      <Icons.ArrowRight />
                                      Invoice
                                    </button>
                                  )}
                                  
                                  {/* Mark as Paid (for invoices) */}
                                  {item.type === 'invoice' && item.status !== 'paid' && (
                                    <button 
                                      onClick={() => {
                                        const confirmed = confirm(`Mark Invoice ${item.id} as paid?\n\nClient: ${item.client}\nAmount: R${item.amount.toLocaleString()}`);
                                        if (confirmed) {
                                          setQuotesAndInvoices(prev => prev.map(i => 
                                            i.id === item.id ? { ...i, status: 'paid' } : i
                                          ));
                                          alert(`✓ Invoice ${item.id} marked as paid`);
                                        }
                                      }}
                                      className="px-3 py-1.5 text-xs border border-green-600 text-green-600 rounded hover:bg-green-50 transition-colors"
                                    >
                                      Paid
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {/* Empty State */}
                      {quotesAndInvoices.filter(item => {
                        if (invoiceTab === 'quotes' && item.type !== 'quote') return false;
                        if (invoiceTab === 'invoices' && item.type !== 'invoice') return false;
                        return true;
                      }).length === 0 && (
                        <div className="p-12 text-center text-gray-400">
                          <Icons.FileText />
                          <p className="mt-3">No {invoiceTab === 'all' ? 'quotes or invoices' : invoiceTab} found</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Quick Create Buttons */}
                  <div className="flex gap-3 mt-6">
                    <button 
                      onClick={() => { 
                        setActiveView('inbox'); 
                        alert('To create a new quote:\n\n1. Select a ticket from the Inbox\n2. Click "Add Services" in the Quick Actions panel\n3. Select services and click "Create Quote"');
                      }} 
                      className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors">
                      <Icons.Plus /><Icons.FileText />New Quote
                    </button>
                    <button 
                      onClick={() => { 
                        setActiveView('inbox');
                        alert('To create a new invoice:\n\n1. Select a ticket from the Inbox\n2. Click "Add Services" in the Quick Actions panel\n3. Select services and click "Create Invoice"');
                      }} 
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                      <Icons.Plus /><Icons.Invoice />New Invoice
                    </button>
                  </div>
                </div>
              )}
              {activeView === 'agents' && (
                <div>
                  {/* Admin Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Agent Management</h1>
                      <p className="text-sm text-gray-500 mt-1">Manage your team and import vendors from Zoho Books</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => { fetchZohoVendors(); setShowImportAgentsModal(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 border-2 border-slate-800 text-slate-800 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                      >
                        <Icons.Download />
                        Import from Zoho
                      </button>
                      <button 
                        onClick={() => { 
                          setAgentForm({ name: '', email: '', phone: '', role: 'Agent', commissionRate: 50 });
                          setShowAddAgentModal(true); 
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors"
                      >
                        <Icons.Plus />
                        Add Agent
                      </button>
                    </div>
                  </div>

                  {/* Agent Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                      <h4 className="text-sm text-gray-500 mb-2">Total Agents</h4>
                      <p className="text-2xl font-semibold">{data.agents.length}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                      <h4 className="text-sm text-gray-500 mb-2">Unassigned Tickets</h4>
                      <p className="text-2xl font-semibold text-red-500">{data.tickets.filter(t => !t.assignedTo && t.status === 'open').length}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                      <h4 className="text-sm text-gray-500 mb-2">Open Tickets</h4>
                      <p className="text-2xl font-semibold text-amber-500">{data.tickets.filter(t => t.status === 'open').length}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                      <h4 className="text-sm text-gray-500 mb-2">Resolved Today</h4>
                      <p className="text-2xl font-semibold text-green-500">{data.tickets.filter(t => t.status === 'resolved').length}</p>
                    </div>
                  </div>

                  {/* Agent Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.agents.map(agent => {
                      const agentTickets = data.tickets.filter(t => t.assignedTo?.id === agent.id);
                      const openTickets = agentTickets.filter(t => t.status === 'open');
                      const pendingTickets = agentTickets.filter(t => t.status === 'pending');
                      const agentBills = bills.filter(b => b.agent.id === agent.id);
                      const totalEarnings = agentBills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.amount, 0);
                      const pendingPayments = agentBills.filter(b => b.status !== 'paid').reduce((sum, b) => sum + b.amount, 0);
                      
                      return (
                        <div key={agent.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 ${agent.color} text-white rounded-full flex items-center justify-center font-semibold`}>{agent.avatar}</div>
                              <div>
                                <h3 className="font-semibold">{agent.name}</h3>
                                <p className="text-sm text-gray-500">{agent.role}</p>
                                {agent.zohoVendorId && (
                                  <span className="inline-flex items-center gap-1 text-xs text-blue-600 mt-0.5">
                                    <Icons.Link />
                                    Zoho: {agent.zohoVendorId}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 mr-2">
                                <span className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                <span className="text-xs text-gray-500 capitalize">{agent.status || 'active'}</span>
                              </div>
                              <button 
                                onClick={() => {
                                  setSelectedAgentForEdit(agent);
                                  setAgentForm({
                                    name: agent.name,
                                    email: agent.email,
                                    phone: agent.phone,
                                    role: agent.role,
                                    commissionRate: agent.commissionRate || 50
                                  });
                                  setShowEditAgentModal(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-slate-800 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Edit Agent"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                              {agent.role !== 'Administrator' && (
                                <button 
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to remove ${agent.name}?\n\nThis will not delete them from Zoho Books.`)) {
                                      setData(prev => ({
                                        ...prev,
                                        agents: prev.agents.filter(a => a.id !== agent.id)
                                      }));
                                    }
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remove Agent"
                                >
                                  <Icons.Trash />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Contact Info */}
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 pb-3 border-b border-gray-100">
                            <span className="flex items-center gap-1"><Icons.Email />{agent.email}</span>
                            {agent.phone && <span className="flex items-center gap-1">{agent.phone}</span>}
                          </div>
                          
                          {/* Commission Rate Badge */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-gray-500">Commission Rate</span>
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">{agent.commissionRate || 50}%</span>
                          </div>
                          
                          {/* Workload Stats */}
                          <div className="grid grid-cols-4 gap-2 mb-4 py-3 border-t border-b border-gray-100">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-blue-500">{openTickets.length}</div>
                              <div className="text-xs text-gray-500">Open</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-amber-500">{pendingTickets.length}</div>
                              <div className="text-xs text-gray-500">Pending</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-green-500">R{totalEarnings.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">Paid</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-purple-500">R{pendingPayments.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">Owed</div>
                            </div>
                          </div>
                          
                          {/* Assigned Tickets */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold uppercase text-gray-500">Active Tickets</h4>
                            {openTickets.slice(0, 3).map(ticket => (
                              <div key={ticket.id} onClick={() => { setSelectedTicket(ticket); setActiveView('inbox'); setTicketPanelTab('details'); setEditingClient(false); }}
                                className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                                <span style={{ color: getChannelColor(ticket.channel) }}>{getChannelIcon(ticket.channel)}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{ticket.subject}</p>
                                  <p className="text-xs text-gray-500">{ticket.client.name}</p>
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: getPriorityColor(ticket.priority) }}>{ticket.priority}</span>
                              </div>
                            ))}
                            {openTickets.length === 0 && (
                              <p className="text-sm text-gray-400 py-2">No active tickets</p>
                            )}
                            {openTickets.length > 3 && (
                              <button className="text-sm text-slate-800 hover:underline">+{openTickets.length - 3} more tickets</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Unassigned Tickets */}
                  {data.tickets.filter(t => !t.assignedTo && t.status === 'open').length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">Unassigned Tickets ({data.tickets.filter(t => !t.assignedTo && t.status === 'open').length})</h3>
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Ticket</th>
                              <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Client</th>
                              <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Channel</th>
                              <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Priority</th>
                              <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.tickets.filter(t => !t.assignedTo && t.status === 'open').slice(0, 5).map(ticket => (
                              <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="p-4">
                                  <p className="font-medium">{ticket.id}</p>
                                  <p className="text-sm text-gray-500 truncate max-w-xs">{ticket.subject}</p>
                                </td>
                                <td className="p-4">{ticket.client.name}</td>
                                <td className="p-4"><span className="flex items-center gap-1" style={{ color: getChannelColor(ticket.channel) }}>{getChannelIcon(ticket.channel)} {ticket.channel}</span></td>
                                <td className="p-4"><span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: getPriorityColor(ticket.priority) }}>{ticket.priority}</span></td>
                                <td className="p-4">
                                  <button onClick={() => { setAssignTarget({ type: 'ticket', id: ticket.id }); setShowAgentModal(true); }}
                                    className="px-3 py-1.5 text-xs bg-slate-800 text-white rounded hover:bg-slate-900">
                                    Assign
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {activeView === 'settings' && (
                <div className="space-y-6">
                  {/* Channel Integrations */}
                  <div>
                    <h2 className="text-lg font-semibold mb-4">Channel Integrations</h2>
                    <p className="text-sm text-gray-500 mb-4">Connect communication channels to receive tickets from multiple sources.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* WhatsApp Business */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                              <Icons.WhatsApp />
                            </div>
                            <div>
                              <h3 className="font-semibold">WhatsApp Business</h3>
                              <p className="text-xs text-gray-500">Meta Cloud API</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Connected</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Receive and reply to WhatsApp messages as tickets.</p>
                        <div className="space-y-2 text-xs text-gray-500 mb-4">
                          <div className="flex justify-between"><span>Webhook URL:</span><span className="font-mono">/api/webhooks/whatsapp</span></div>
                          <div className="flex justify-between"><span>Last message:</span><span>2 min ago</span></div>
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Configure</button>
                          <button className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Test</button>
                        </div>
                      </div>

                      {/* Email IMAP/SMTP */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                              <Icons.Email />
                            </div>
                            <div>
                              <h3 className="font-semibold">Email</h3>
                              <p className="text-xs text-gray-500">IMAP/SMTP</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Connected</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Sync emails as tickets and send replies.</p>
                        <div className="space-y-2 text-xs text-gray-500 mb-4">
                          <div className="flex justify-between"><span>IMAP Host:</span><span>imap.zoho.com</span></div>
                          <div className="flex justify-between"><span>Last sync:</span><span>5 min ago</span></div>
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Configure</button>
                          <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Sync Now</button>
                        </div>
                      </div>

                      {/* Zoho SalesIQ */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                              <Icons.Chat />
                            </div>
                            <div>
                              <h3 className="font-semibold">Zoho SalesIQ</h3>
                              <p className="text-xs text-gray-500">Live Chat</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Connected</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Convert website chat conversations to tickets.</p>
                        <div className="space-y-2 text-xs text-gray-500 mb-4">
                          <div className="flex justify-between"><span>Webhook URL:</span><span className="font-mono">/api/webhooks/salesiq</span></div>
                          <div className="flex justify-between"><span>Active chats:</span><span>3</span></div>
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Configure</button>
                          <button className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">Test</button>
                        </div>
                      </div>

                      {/* Web Forms */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                              <Icons.Form />
                            </div>
                            <div>
                              <h3 className="font-semibold">Web Forms</h3>
                              <p className="text-xs text-gray-500">Contact Form API</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Active</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Receive tickets from website contact forms.</p>
                        <div className="space-y-2 text-xs text-gray-500 mb-4">
                          <div className="flex justify-between"><span>Endpoint:</span><span className="font-mono">POST /api/tickets</span></div>
                          <div className="flex justify-between"><span>Today:</span><span>12 submissions</span></div>
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">View Docs</button>
                          <button className="px-3 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600">Embed Code</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Business Integrations */}
                  <div>
                    <h2 className="text-lg font-semibold mb-4">Business Integrations</h2>
                    <p className="text-sm text-gray-500 mb-4">Connect business tools for quotes, invoices, and task management.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Zoho Books */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                              <Icons.Invoice />
                            </div>
                            <div>
                              <h3 className="font-semibold">Zoho Books</h3>
                              <p className="text-xs text-gray-500">Accounting</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Connected</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Create quotes, invoices, and bills directly from tickets.</p>
                        <div className="space-y-2 text-xs text-gray-500 mb-4">
                          <div className="flex justify-between"><span>Organization:</span><span>Easy Services Group</span></div>
                          <div className="flex justify-between"><span>Services synced:</span><span>18 items</span></div>
                          <div className="flex justify-between"><span>Last sync:</span><span>1 hour ago</span></div>
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Configure</button>
                          <button className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Sync Services</button>
                        </div>
                      </div>

                      {/* Trello */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                              <Icons.FileText />
                            </div>
                            <div>
                              <h3 className="font-semibold">Trello</h3>
                              <p className="text-xs text-gray-500">Task Management</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Not Connected</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Create Trello cards from tickets for task tracking.</p>
                        <div className="space-y-2 text-xs text-gray-500 mb-4">
                          <div className="flex justify-between"><span>Board:</span><span className="text-gray-400">Not configured</span></div>
                          <div className="flex justify-between"><span>Cards created:</span><span>0</span></div>
                        </div>
                        <div className="flex gap-2">
                          <button className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Connect Trello</button>
                        </div>
                      </div>

                      {/* Team Management */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                              <Icons.UserCheck />
                            </div>
                            <div>
                              <h3 className="font-semibold">Team Management</h3>
                              <p className="text-xs text-gray-500">Agents & Roles</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Active</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Manage agents, roles, and ticket assignments.</p>
                        <div className="space-y-2 text-xs text-gray-500 mb-4">
                          <div className="flex justify-between"><span>Active agents:</span><span>{data.agents.length}</span></div>
                          <div className="flex justify-between"><span>Commission rate:</span><span>50%</span></div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setActiveView('agents')} className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Manage Agents</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Webhook Configuration */}
                  <div>
                    <h2 className="text-lg font-semibold mb-4">Webhook Endpoints</h2>
                    <p className="text-sm text-gray-500 mb-4">Configure these URLs in your external services to receive data.</p>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Service</th>
                            <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Endpoint</th>
                            <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Method</th>
                            <th className="text-left p-4 text-xs font-semibold uppercase text-gray-500">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { service: 'WhatsApp', endpoint: '/api/webhooks/whatsapp', method: 'GET/POST', status: 'Active' },
                            { service: 'SalesIQ', endpoint: '/api/webhooks/salesiq', method: 'POST', status: 'Active' },
                            { service: 'Web Forms', endpoint: '/api/tickets', method: 'POST', status: 'Active' },
                            { service: 'Email Sync', endpoint: '/api/email/sync', method: 'POST', status: 'Manual' },
                          ].map((webhook, i) => (
                            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="p-4 text-sm font-medium">{webhook.service}</td>
                              <td className="p-4 text-sm font-mono text-gray-600">{webhook.endpoint}</td>
                              <td className="p-4 text-sm text-gray-500">{webhook.method}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  webhook.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                }`}>{webhook.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* API Configuration Note */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                    <h3 className="font-semibold text-slate-800 mb-2">Environment Configuration</h3>
                    <p className="text-sm text-slate-600 mb-3">
                      API keys and credentials are configured via environment variables on the server. 
                      Contact your administrator to update integration settings.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <p className="text-slate-500 mb-1">WhatsApp</p>
                        <p className="font-mono text-slate-700">WHATSAPP_*</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <p className="text-slate-500 mb-1">Email</p>
                        <p className="font-mono text-slate-700">EMAIL_*, IMAP_*, SMTP_*</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <p className="text-slate-500 mb-1">Zoho Books</p>
                        <p className="font-mono text-slate-700">ZOHO_BOOKS_*</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <p className="text-slate-500 mb-1">SalesIQ</p>
                        <p className="font-mono text-slate-700">SALESIQ_*</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Agent Assignment Modal */}
      {showAgentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Assign to Agent</h2>
              <button onClick={() => { setShowAgentModal(false); setAssignTarget(null); }} className="p-1 hover:bg-gray-100 rounded"><Icons.X /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-4">
                {assignTarget?.type === 'ticket' 
                  ? `Assign ticket ${assignTarget.id} to an agent`
                  : `Assign all open tickets from ${assignTarget?.name} to an agent`
                }
              </p>
              <div className="space-y-2">
                {data.agents.map(agent => {
                  const agentOpenTickets = data.tickets.filter(t => t.assignedTo?.id === agent.id && t.status === 'open').length;
                  return (
                    <button 
                      key={agent.id}
                      onClick={() => {
                        if (assignTarget?.type === 'ticket') {
                          setData({
                            ...data,
                            tickets: data.tickets.map(t => 
                              t.id === assignTarget.id ? { ...t, assignedTo: agent } : t
                            )
                          });
                          if (selectedTicket?.id === assignTarget.id) {
                            setSelectedTicket({ ...selectedTicket, assignedTo: agent });
                          }
                        } else if (assignTarget?.type === 'client') {
                          setData({
                            ...data,
                            tickets: data.tickets.map(t => 
                              t.client.id === assignTarget.id && t.status === 'open' ? { ...t, assignedTo: agent } : t
                            )
                          });
                        }
                        setShowAgentModal(false);
                        setAssignTarget(null);
                      }}
                      className="flex items-center gap-3 w-full p-3 border border-gray-200 rounded-lg hover:border-slate-800 hover:bg-gray-50 transition-colors"
                    >
                      <div className={`w-10 h-10 ${agent.color} text-white rounded-full flex items-center justify-center font-semibold text-sm`}>{agent.avatar}</div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-xs text-gray-500">{agent.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{agentOpenTickets}</p>
                        <p className="text-xs text-gray-500">open</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button onClick={() => { setShowAgentModal(false); setAssignTarget(null); }} className="w-full py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-100">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Services Modal - Redesigned for Better UX */}
      {showServiceBuilder && selectedClient && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl flex flex-col" style={{ height: 'calc(100vh - 60px)', maxHeight: '900px' }}>
            {/* Compact Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-2xl flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-500 text-slate-900 rounded-full flex items-center justify-center text-sm font-bold">
                  {selectedClient.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Add Services for {selectedClient.name}</h2>
                  <p className="text-sm text-slate-400">{selectedClient.email}</p>
                </div>
              </div>
              <button onClick={() => { setShowServiceBuilder(false); setSelectedClient(null); setServiceCart([]); }} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors">
                <Icons.X />
              </button>
            </div>

            {/* Main Content - 3 Column Layout */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Sidebar - Category Navigation */}
              <div className="w-48 bg-slate-50 border-r border-gray-200 flex flex-col flex-shrink-0 overflow-hidden">
                <div className="p-3 border-b border-gray-200 flex-shrink-0">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Categories</h3>
                </div>
                <div className="flex-1 overflow-y-auto py-2">
                  {['All', ...new Set(data.services.map(s => s.category))].map(cat => {
                    const count = cat === 'All' ? data.services.length : data.services.filter(s => s.category === cat).length;
                    const isActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-all ${
                          isActive 
                            ? 'bg-amber-500 text-white font-medium' 
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{cat}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${isActive ? 'bg-white/20' : 'bg-slate-200 text-slate-500'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Center - Services Grid */}
              <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
                {/* Search Bar - Sticky */}
                <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Icons.Search />
                    </div>
                    <input
                      type="text"
                      placeholder="Search services..."
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    {serviceSearch && (
                      <button 
                        onClick={() => setServiceSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <Icons.X />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Services Grid - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: 0 }}>
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                    {data.services
                      .filter(service => {
                        const matchesSearch = service.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
                                            service.description.toLowerCase().includes(serviceSearch.toLowerCase());
                        const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
                        return matchesSearch && matchesCategory;
                      })
                      .map(service => {
                        const inCart = serviceCart.find(item => item.service.id === service.id);
                        return (
                          <div 
                            key={service.id} 
                            className={`relative p-4 border-2 rounded-xl transition-all ${
                              inCart 
                                ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                                : 'border-gray-200 hover:border-amber-400 hover:shadow-md bg-white cursor-pointer'
                            }`}
                            onClick={() => {
                              if (!inCart) {
                                setServiceCart([...serviceCart, { service, quantity: 1 }]);
                              }
                            }}
                          >
                            {/* Added Badge */}
                            {inCart && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                            
                            {/* Service Info */}
                            <div className="mb-3">
                              <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-1">{service.name}</h4>
                              <p className="text-xs text-gray-500 line-clamp-2">{service.description}</p>
                            </div>
                            
                            {/* Price & Action */}
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-lg font-bold text-slate-800">R{service.rate.toLocaleString()}</span>
                                <span className="text-xs text-gray-400 ml-1">/{service.unit.replace('per ', '')}</span>
                              </div>
                              
                              {inCart ? (
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => {
                                      if (inCart.quantity === 1) {
                                        setServiceCart(serviceCart.filter(item => item.service.id !== service.id));
                                      } else {
                                        setServiceCart(serviceCart.map(item => 
                                          item.service.id === service.id ? { ...item, quantity: item.quantity - 1 } : item
                                        ));
                                      }
                                    }}
                                    className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-sm font-bold"
                                  >
                                    −
                                  </button>
                                  <span className="w-8 text-center font-bold text-green-700">{inCart.quantity}</span>
                                  <button
                                    onClick={() => {
                                      setServiceCart(serviceCart.map(item => 
                                        item.service.id === service.id ? { ...item, quantity: item.quantity + 1 } : item
                                      ));
                                    }}
                                    className="w-7 h-7 flex items-center justify-center bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setServiceCart([...serviceCart, { service, quantity: 1 }]);
                                  }}
                                  className="w-9 h-9 flex items-center justify-center bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-sm"
                                >
                                  <Icons.Plus />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  
                  {/* No Results */}
                  {data.services.filter(service => {
                    const matchesSearch = service.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
                                        service.description.toLowerCase().includes(serviceSearch.toLowerCase());
                    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
                    return matchesSearch && matchesCategory;
                  }).length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Icons.Search />
                      </div>
                      <p className="font-medium text-gray-500">No services found</p>
                      <p className="text-sm mt-1">Try a different search or category</p>
                    </div>
                  )}
                </div>
                
                {/* Services Footer */}
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex items-center justify-between flex-shrink-0">
                  <span>{data.services.filter(s => selectedCategory === 'All' || s.category === selectedCategory).length} services in {selectedCategory}</span>
                  <span className="text-amber-600 font-medium">Click to add • Click quantity to adjust</span>
                </div>
              </div>

              {/* Right Sidebar - Cart */}
              <div className="w-80 flex flex-col bg-slate-50 border-l border-gray-200 flex-shrink-0 overflow-hidden">
                {/* Cart Header */}
                <div className="p-4 bg-amber-500 flex-shrink-0">
                  <div className="flex items-center justify-between text-white">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Icons.ShoppingCart />
                      Your Selection
                    </h3>
                    <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-medium">
                      {serviceCart.reduce((sum, item) => sum + item.quantity, 0)} items
                    </span>
                  </div>
                </div>

                {/* Cart Items - Scrollable */}
                <div className="flex-1 overflow-y-auto p-3" style={{ minHeight: 0 }}>
                  {serviceCart.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Icons.ShoppingCart />
                      </div>
                      <p className="font-medium text-gray-500">No services selected</p>
                      <p className="text-sm mt-1 text-gray-400">Click services to add them</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {serviceCart.map((item, index) => (
                        <div key={item.service.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-medium text-sm text-gray-900 flex-1 leading-tight">{item.service.name}</h4>
                            <button
                              onClick={() => setServiceCart(serviceCart.filter((_, i) => i !== index))}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Icons.Trash />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  if (item.quantity === 1) {
                                    setServiceCart(serviceCart.filter((_, i) => i !== index));
                                  } else {
                                    setServiceCart(serviceCart.map((it, i) => 
                                      i === index ? { ...it, quantity: it.quantity - 1 } : it
                                    ));
                                  }
                                }}
                                className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-bold"
                              >
                                −
                              </button>
                              <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                              <button
                                onClick={() => {
                                  setServiceCart(serviceCart.map((it, i) => 
                                    i === index ? { ...it, quantity: it.quantity + 1 } : it
                                  ));
                                }}
                                className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-bold"
                              >
                                +
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-slate-800">R{(item.service.rate * item.quantity).toLocaleString()}</p>
                              {item.quantity > 1 && (
                                <p className="text-xs text-gray-400">R{item.service.rate} × {item.quantity}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cart Footer - Summary & Actions */}
                <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0">
                  {serviceCart.length > 0 ? (
                    <div className="space-y-4">
                      {/* Total */}
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Total</span>
                        <span className="text-xl font-bold text-amber-600">
                          R{serviceCart.reduce((sum, item) => sum + (item.service.rate * item.quantity), 0).toLocaleString()}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const total = serviceCart.reduce((sum, item) => sum + (item.service.rate * item.quantity), 0);
                            const newQuoteId = `QT-${String(quotesAndInvoices.filter(i => i.type === 'quote').length + 1).padStart(3, '0')}`;
                            
                            setQuotesAndInvoices(prev => [...prev, {
                              type: 'quote',
                              id: newQuoteId,
                              client: selectedClient.name,
                              clientEmail: selectedClient.email,
                              amount: total,
                              status: 'draft',
                              date: new Date().toISOString().split('T')[0],
                              items: serviceCart.map(item => ({
                                name: item.service.name,
                                qty: item.quantity,
                                rate: item.service.rate
                              })),
                              assignedAgent: null,
                              billId: null
                            }]);
                            
                            alert(`✓ Quote ${newQuoteId} created!\n\nClient: ${selectedClient.name}\nTotal: R${total.toLocaleString()}\n\nView it in Quotes & Invoices.`);
                            setShowServiceBuilder(false);
                            setSelectedClient(null);
                            setServiceCart([]);
                          }}
                          className="flex-1 py-2.5 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-all flex items-center justify-center gap-1.5 text-sm"
                        >
                          <Icons.FileText />
                          Quote
                        </button>
                        <button
                          onClick={() => {
                            const total = serviceCart.reduce((sum, item) => sum + (item.service.rate * item.quantity), 0);
                            const newInvoiceId = `INV-${String(quotesAndInvoices.filter(i => i.type === 'invoice').length + 1).padStart(3, '0')}`;
                            
                            setQuotesAndInvoices(prev => [...prev, {
                              type: 'invoice',
                              id: newInvoiceId,
                              client: selectedClient.name,
                              clientEmail: selectedClient.email,
                              amount: total,
                              status: 'pending',
                              date: new Date().toISOString().split('T')[0],
                              items: serviceCart.map(item => ({
                                name: item.service.name,
                                qty: item.quantity,
                                rate: item.service.rate
                              })),
                              assignedAgent: null,
                              billId: null
                            }]);
                            
                            alert(`✓ Invoice ${newInvoiceId} created!\n\nClient: ${selectedClient.name}\nTotal: R${total.toLocaleString()}\n\nView it in Quotes & Invoices.`);
                            setShowServiceBuilder(false);
                            setSelectedClient(null);
                            setServiceCart([]);
                          }}
                          className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-1.5 text-sm"
                        >
                          <Icons.Invoice />
                          Invoice
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 mb-3">Select services to get started</p>
                      <div className="flex gap-2">
                        <button disabled className="flex-1 py-2.5 bg-gray-100 text-gray-400 rounded-lg font-medium text-sm cursor-not-allowed">
                          Quote
                        </button>
                        <button disabled className="flex-1 py-2.5 bg-gray-100 text-gray-400 rounded-lg font-medium text-sm cursor-not-allowed">
                          Invoice
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Agent Assignment Modal */}
      {showInvoiceAgentModal && selectedInvoiceForAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Assign Agent to {selectedInvoiceForAgent.type === 'quote' ? 'Quote' : 'Invoice'}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {selectedInvoiceForAgent.id} • {selectedInvoiceForAgent.client} • R{selectedInvoiceForAgent.amount.toLocaleString()}
              </p>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-4">
                Select an agent to handle this {selectedInvoiceForAgent.type}. 
                {selectedInvoiceForAgent.type === 'invoice' && ' A bill will be created for the agent with 50% commission on each service.'}
              </p>
              <div className="space-y-2">
                {data.agents.map(agent => {
                  const agentBills = bills.filter(b => b.agent.id === agent.id && b.status !== 'paid');
                  return (
                    <button
                      key={agent.id}
                      onClick={() => {
                        // Assign agent to the invoice/quote
                        setQuotesAndInvoices(prev => prev.map(item => 
                          item.id === selectedInvoiceForAgent.id 
                            ? { ...item, assignedAgent: { id: agent.id, name: agent.name } } 
                            : item
                        ));
                        
                        // If it's an invoice, offer to create bill
                        if (selectedInvoiceForAgent.type === 'invoice') {
                          const createBill = confirm(`Agent ${agent.name} assigned!\n\nCreate a bill for this agent now?\n\nThe bill will include all services at 50% commission rate.`);
                          if (createBill) {
                            const newBillId = `BILL-${String(bills.length + 1).padStart(3, '0')}`;
                            const billItems = selectedInvoiceForAgent.items.map(i => ({
                              name: i.name,
                              qty: i.qty,
                              rate: getAgentRate(i.rate)
                            }));
                            const billAmount = billItems.reduce((sum, i) => sum + (i.qty * i.rate), 0);
                            
                            setBills(prev => [...prev, {
                              id: newBillId,
                              invoiceId: selectedInvoiceForAgent.id,
                              agent: { id: agent.id, name: agent.name, email: agent.email },
                              amount: billAmount,
                              status: 'draft',
                              date: new Date().toISOString().split('T')[0],
                              items: billItems
                            }]);
                            
                            setQuotesAndInvoices(prev => prev.map(item => 
                              item.id === selectedInvoiceForAgent.id 
                                ? { ...item, billId: newBillId, billStatus: 'draft' } 
                                : item
                            ));
                            
                            alert(`✓ Bill ${newBillId} created for ${agent.name}\n\nAmount: R${billAmount.toLocaleString()}`);
                          }
                        } else {
                          alert(`✓ Agent ${agent.name} assigned to ${selectedInvoiceForAgent.id}`);
                        }
                        
                        setShowInvoiceAgentModal(false);
                        setSelectedInvoiceForAgent(null);
                      }}
                      className="flex items-center gap-3 w-full p-3 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                    >
                      <div className={`w-10 h-10 ${agent.color || 'bg-purple-500'} text-white rounded-full flex items-center justify-center font-semibold text-sm`}>
                        {agent.avatar || agent.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-xs text-gray-500">{agent.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-purple-600">{agentBills.length}</p>
                        <p className="text-xs text-gray-500">pending bills</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button 
                onClick={() => { setShowInvoiceAgentModal(false); setSelectedInvoiceForAgent(null); }} 
                className="w-full py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Agents from Zoho Books Modal */}
      {showImportAgentsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                    </div>
                    Import from Zoho Books
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Select vendors to import as agents</p>
                </div>
                <button onClick={() => { setShowImportAgentsModal(false); setSelectedVendors([]); setVendorSearch(''); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Icons.X />
                </button>
              </div>
            </div>
            
            <div className="p-5 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                  <Icons.Search />
                  <input 
                    type="text" 
                    placeholder="Search vendors..." 
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm" 
                  />
                </div>
                <button 
                  onClick={fetchZohoVendors}
                  disabled={loadingVendors}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  <Icons.RefreshCw className={loadingVendors ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {loadingVendors ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-10 h-10 border-3 border-slate-800 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm text-gray-500">Fetching vendors from Zoho Books...</p>
                </div>
              ) : zohoVendors.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icons.Users />
                  </div>
                  <p className="text-gray-500 mb-4">No vendors found</p>
                  <button onClick={fetchZohoVendors} className="text-sm text-slate-800 hover:underline">
                    Refresh vendor list
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {zohoVendors
                    .filter(v => 
                      v.contact_name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
                      v.email.toLowerCase().includes(vendorSearch.toLowerCase()) ||
                      (v.company_name && v.company_name.toLowerCase().includes(vendorSearch.toLowerCase()))
                    )
                    .map(vendor => {
                      const isAlreadyAgent = data.agents.some(a => a.zohoVendorId === vendor.vendor_id);
                      const isSelected = selectedVendors.includes(vendor.vendor_id);
                      
                      return (
                        <div 
                          key={vendor.vendor_id}
                          onClick={() => {
                            if (isAlreadyAgent) return;
                            setSelectedVendors(prev => 
                              isSelected 
                                ? prev.filter(id => id !== vendor.vendor_id)
                                : [...prev, vendor.vendor_id]
                            );
                          }}
                          className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                            isAlreadyAgent 
                              ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed' 
                              : isSelected 
                                ? 'border-slate-800 bg-slate-50 ring-2 ring-slate-800/20' 
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            isAlreadyAgent 
                              ? 'border-green-500 bg-green-500' 
                              : isSelected 
                                ? 'border-slate-800 bg-slate-800' 
                                : 'border-gray-300'
                          }`}>
                            {(isAlreadyAgent || isSelected) && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                            )}
                          </div>
                          
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                            {vendor.contact_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{vendor.contact_name}</p>
                              {isAlreadyAgent && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex-shrink-0">
                                  Already Agent
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">{vendor.email}</p>
                            {vendor.company_name && (
                              <p className="text-xs text-gray-400 truncate">{vendor.company_name}</p>
                            )}
                          </div>
                          
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-mono text-gray-400">{vendor.vendor_id}</p>
                            <p className="text-xs text-gray-400">{vendor.phone}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {selectedVendors.length > 0 ? (
                    <span className="font-medium text-slate-800">{selectedVendors.length} vendor(s) selected</span>
                  ) : (
                    'Select vendors to import as agents'
                  )}
                </p>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => { setShowImportAgentsModal(false); setSelectedVendors([]); setVendorSearch(''); }} 
                    className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={importSelectedVendors}
                    disabled={selectedVendors.length === 0}
                    className="px-4 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Icons.Download />
                    Import {selectedVendors.length > 0 ? `(${selectedVendors.length})` : ''}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Agent Modal */}
      {showAddAgentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add New Agent</h3>
                <button onClick={() => setShowAddAgentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Icons.X />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">Create a new agent manually</p>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  value={agentForm.name}
                  onChange={(e) => setAgentForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. John Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input 
                  type="email" 
                  value={agentForm.email}
                  onChange={(e) => setAgentForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. john@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input 
                  type="tel" 
                  value={agentForm.phone}
                  onChange={(e) => setAgentForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. +27 82 123 4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select 
                    value={agentForm.role}
                    onChange={(e) => setAgentForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                  >
                    <option value="Agent">Agent</option>
                    <option value="Senior Agent">Senior Agent</option>
                    <option value="Team Lead">Team Lead</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission %</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={agentForm.commissionRate}
                    onChange={(e) => setAgentForm(prev => ({ ...prev, commissionRate: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent" 
                  />
                </div>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> This agent will be created locally. To link to Zoho Books, use the "Import from Zoho" feature instead.
                </p>
              </div>
            </div>
            
            <div className="p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl flex gap-3">
              <button 
                onClick={() => setShowAddAgentModal(false)} 
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (!agentForm.name || !agentForm.email) {
                    alert('Please fill in name and email');
                    return;
                  }
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'];
                  const newAgent = {
                    id: data.agents.length + 1,
                    name: agentForm.name,
                    email: agentForm.email,
                    phone: agentForm.phone,
                    role: agentForm.role,
                    avatar: agentForm.name.split(' ').map(n => n[0]).join('').slice(0, 2),
                    color: colors[data.agents.length % colors.length],
                    zohoVendorId: null,
                    commissionRate: agentForm.commissionRate,
                    status: 'active',
                    createdAt: new Date().toISOString(),
                  };
                  setData(prev => ({ ...prev, agents: [...prev.agents, newAgent] }));
                  setShowAddAgentModal(false);
                  setAgentForm({ name: '', email: '', phone: '', role: 'Agent', commissionRate: 50 });
                  alert(`✓ Agent ${newAgent.name} added successfully`);
                }}
                className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900"
              >
                Add Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Agent Modal */}
      {showEditAgentModal && selectedAgentForEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Edit Agent</h3>
                <button onClick={() => { setShowEditAgentModal(false); setSelectedAgentForEdit(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Icons.X />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">Update agent information</p>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Agent Avatar Preview */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <div className={`w-14 h-14 ${selectedAgentForEdit.color} text-white rounded-full flex items-center justify-center font-bold text-lg`}>
                  {agentForm.name ? agentForm.name.split(' ').map(n => n[0]).join('').slice(0, 2) : selectedAgentForEdit.avatar}
                </div>
                <div>
                  <p className="font-medium">{agentForm.name || selectedAgentForEdit.name}</p>
                  {selectedAgentForEdit.zohoVendorId && (
                    <p className="text-xs text-blue-600 flex items-center gap-1">
                      <Icons.Link />
                      Linked to Zoho: {selectedAgentForEdit.zohoVendorId}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  value={agentForm.name}
                  onChange={(e) => setAgentForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input 
                  type="email" 
                  value={agentForm.email}
                  onChange={(e) => setAgentForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input 
                  type="tel" 
                  value={agentForm.phone}
                  onChange={(e) => setAgentForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select 
                    value={agentForm.role}
                    onChange={(e) => setAgentForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                    disabled={selectedAgentForEdit.role === 'Administrator'}
                  >
                    <option value="Agent">Agent</option>
                    <option value="Senior Agent">Senior Agent</option>
                    <option value="Team Lead">Team Lead</option>
                    {selectedAgentForEdit.role === 'Administrator' && <option value="Administrator">Administrator</option>}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission %</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={agentForm.commissionRate}
                    onChange={(e) => setAgentForm(prev => ({ ...prev, commissionRate: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent" 
                  />
                </div>
              </div>
              
              {/* Status Toggle */}
              <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-700">Agent Status</p>
                  <p className="text-xs text-gray-500">Inactive agents won't appear in assignments</p>
                </div>
                <button 
                  onClick={() => {
                    setData(prev => ({
                      ...prev,
                      agents: prev.agents.map(a => 
                        a.id === selectedAgentForEdit.id 
                          ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' }
                          : a
                      )
                    }));
                    setSelectedAgentForEdit(prev => ({ ...prev, status: prev.status === 'active' ? 'inactive' : 'active' }));
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors ${selectedAgentForEdit.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${selectedAgentForEdit.status === 'active' ? 'left-7' : 'left-1'}`}></span>
                </button>
              </div>
            </div>
            
            <div className="p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl flex gap-3">
              <button 
                onClick={() => { setShowEditAgentModal(false); setSelectedAgentForEdit(null); }} 
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (!agentForm.name || !agentForm.email) {
                    alert('Please fill in name and email');
                    return;
                  }
                  setData(prev => ({
                    ...prev,
                    agents: prev.agents.map(a => 
                      a.id === selectedAgentForEdit.id 
                        ? { 
                            ...a, 
                            name: agentForm.name,
                            email: agentForm.email,
                            phone: agentForm.phone,
                            role: agentForm.role,
                            commissionRate: agentForm.commissionRate,
                            avatar: agentForm.name.split(' ').map(n => n[0]).join('').slice(0, 2),
                          }
                        : a
                    )
                  }));
                  setShowEditAgentModal(false);
                  setSelectedAgentForEdit(null);
                  alert(`✓ Agent ${agentForm.name} updated successfully`);
                }}
                className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
