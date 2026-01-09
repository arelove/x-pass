/**
 * ============================================================================
 * X-PASS Password Manager
 * Copyright (C) 2026 ar3love
 * 
 * Licensed under GPL-3.0. See LICENSE file for details.
 * ============================================================================
 */

interface ReportData {
  filteredPhotos: any[];
  activityStats: ActivityStats | null;
  texts: ReportTexts;
  language: string;
  theme: {
    mode: string;
    primary: string;
    secondary?: string;
    success?: string;
    error?: string;
    backgroundDefault: string;
    backgroundPaper: string;
    textPrimary: string;
    textSecondary: string;
    paletteMode: 'light' | 'dark';
  };
}

interface ActivityStats {
  total_logins: number;
  total_actions: number;
  last_login: string | null;
  most_active_day: string | null;
  actions_by_type: Array<{ action_type: string; count: number }>;
}

interface ReportTexts {
  title: string;
  generatedAt: string;
  summary: string;
  totalAttempts: string;
  uniqueUsers: string;
  mostActiveUser: string;
  peakHour: string;
  detailedLog: string;
  timestamp: string;
  username: string;
  date: string;
  photo: string;
  noPhoto: string;
  totalLogins: string;
  totalActions: string;
  lastLogin: string;
  mostActiveDay: string;
  searchPlaceholder: string;
  printReport: string;
  riskLevel: string;
  low: string;
  medium: string;
  high: string;
  critical: string;
  photoGallery: string;
  [key: string]: string;
}

export const generateSecurityReport = ({ filteredPhotos, activityStats, texts, language, theme }: ReportData): string => {
  const attemptsByUsername = filteredPhotos.reduce((acc, photo) => {
    acc[photo.username_attempt] = (acc[photo.username_attempt] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const attemptsByHour = filteredPhotos.reduce((acc, photo) => {
    const hour = new Date(photo.timestamp).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const mostActiveUser = Object.entries(attemptsByUsername).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
  const peakHourEntry = Object.entries(attemptsByHour).sort((a, b) => (b[1] as number) - (a[1] as number))[0];

  const getRiskLevel = () => {
    const count = filteredPhotos.length;
    const uniqueCount = Object.keys(attemptsByUsername).length;
    if (count === 0) return { level: texts.low, color: '#48bb78', icon: 'âœ“' };
    if (count < 5 && uniqueCount < 3) return { level: texts.low, color: '#48bb78', icon: 'âœ“' };
    if (count < 15 && uniqueCount < 5) return { level: texts.medium, color: '#ed8936', icon: 'âš ' };
    if (count < 30) return { level: texts.high, color: '#f56565', icon: 'âš ' };
    return { level: texts.critical, color: '#c53030', icon: 'â›”' };
  };

  const risk = getRiskLevel();
  const isDark = theme.paletteMode === 'dark';
  const cardBg = theme.backgroundPaper;
  const contentBg = theme.backgroundDefault;
  const textColor = theme.textPrimary;
  const textSecondary = theme.textSecondary;
  const primaryColor = theme.primary;
  const borderColor = isDark ? `${primaryColor}40` : `${primaryColor}30`;
  const hoverBg = isDark ? `${primaryColor}20` : `${primaryColor}10`;
  const shadowColor = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)';
  const inputBg = isDark ? contentBg : '#ffffff';
  const toolbarBg = isDark ? `${cardBg}f5` : 'rgba(255,255,255,0.98)';
  const overlayGradient = isDark ? `${primaryColor}40` : 'rgba(255,255,255,0.1)';

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${texts.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: ${contentBg};
      padding: 20px 10px;
      color: ${textColor};
      line-height: 1.5;
      font-size: 14px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: ${contentBg};
      border-radius: 12px;
      box-shadow: 0 10px 40px ${shadowColor};
      overflow: hidden;
      ${isDark ? `border: 1px solid ${borderColor};` : ''}
    }
    
    .header {
      background: linear-gradient(135deg, ${primaryColor} 0%, ${cardBg} 100%);
      color: ${textColor};
      padding: 30px 20px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, ${overlayGradient} 0%, transparent 70%);
      animation: pulse 15s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(10%, 10%) scale(1.1); }
    }
    
    .header-content { position: relative; z-index: 1; }
    
    .header h1 {
      font-size: clamp(1.5em, 5vw, 2.5em);
      font-weight: 800;
      margin-bottom: 8px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      animation: fadeInDown 0.8s ease;
    }
    
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .header p {
      font-size: clamp(0.85em, 2.5vw, 1em);
      opacity: 0.9;
      animation: fadeIn 1s ease 0.3s both;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .toolbar {
      position: sticky;
      top: 0;
      background: ${toolbarBg};
      backdrop-filter: blur(10px);
      padding: 10px 15px;
      border-bottom: 1px solid ${borderColor};
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      z-index: 100;
      box-shadow: 0 2px 8px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)'};
    }
    
    .search-box {
      flex: 1;
      min-width: 200px;
      max-width: 400px;
      position: relative;
    }
    
    .search-box input {
      width: 100%;
      padding: 8px 35px 8px 12px;
      border: 2px solid ${borderColor};
      border-radius: 20px;
      font-size: 13px;
      transition: all 0.3s;
      background: ${inputBg};
      color: ${textColor};
    }
    
    .search-box input:focus {
      outline: none;
      border-color: ${primaryColor};
      box-shadow: 0 0 0 3px ${primaryColor}40;
    }
    
    .search-box input::placeholder {
      color: ${textSecondary};
    }
    
    .search-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: ${textSecondary};
      font-size: 14px;
    }
    
    .toolbar-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }
    
    .btn-primary {
      background: ${primaryColor};
      color: ${isDark ? textColor : '#ffffff'};
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px ${primaryColor}60;
      filter: brightness(1.1);
    }
    
    .content {
      padding: 20px 15px;
    }
    
    .risk-banner {
      background: ${risk.color};
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideInLeft 0.5s ease;
    }
    
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    .risk-banner .icon {
      font-size: 2em;
      animation: bounce 2s ease infinite;
      flex-shrink: 0;
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    
    .risk-banner .content-risk h3 {
      font-size: clamp(1.1em, 3vw, 1.3em);
      margin-bottom: 4px;
    }
    
    .risk-banner .content-risk p {
      font-size: clamp(0.85em, 2vw, 0.95em);
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 30px;
    }
    
    .summary-card {
      background: ${cardBg};
      border-radius: 10px;
      padding: 16px;
      box-shadow: 0 2px 4px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.07)'};
      transition: all 0.3s;
      border-left: 4px solid ${primaryColor};
      animation: fadeInUp 0.5s ease;
      position: relative;
      overflow: hidden;
    }
    
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .summary-card::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, ${primaryColor}20 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    .summary-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 12px ${isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.12)'};
    }
    
    .summary-card:hover::before {
      opacity: 1;
    }
    
    .summary-card h3 {
      font-size: 0.75em;
      color: ${textSecondary};
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      position: relative;
      z-index: 1;
    }
    
    .summary-card p {
      font-size: clamp(1.3em, 4vw, 1.8em);
      font-weight: 700;
      color: ${textColor};
      position: relative;
      z-index: 1;
      word-break: break-word;
    }
    
    .summary-card.danger { border-left-color: #f56565; }
    .summary-card.warning { border-left-color: #ed8936; }
    .summary-card.success { border-left-color: #48bb78; }
    .summary-card.info { border-left-color: #4299e1; }
    
    .section {
      margin-bottom: 30px;
      animation: fadeIn 0.8s ease;
    }
    
    .section h2 {
      font-size: clamp(1.3em, 4vw, 1.8em);
      margin-bottom: 15px;
      color: ${textColor};
      border-bottom: 3px solid ${primaryColor};
      padding-bottom: 8px;
      display: inline-block;
    }
    
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    
    .photo-card {
      background: ${cardBg};
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 6px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'};
      transition: all 0.3s;
      cursor: pointer;
      animation: fadeInUp 0.5s ease;
      border: 1px solid ${borderColor};
    }
    
    .photo-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 15px ${isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)'};
      border-color: ${primaryColor};
    }
    
    .photo-card img {
      width: 100%;
      height: 150px;
      object-fit: cover;
    }
    
    .photo-card .info {
      padding: 10px;
    }
    
    .photo-card .username {
      font-weight: 600;
      color: ${textColor};
      margin-bottom: 4px;
      font-size: 0.9em;
      word-break: break-word;
    }
    
    .photo-card .timestamp {
      font-size: 0.75em;
      color: ${textSecondary};
    }
    
    .table-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    
    table {
      width: 100%;
      min-width: 600px;
      border-collapse: separate;
      border-spacing: 0;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 4px ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.07)'};
      animation: fadeIn 1s ease;
    }
    
    thead {
      background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%);
      color: ${isDark ? textColor : '#ffffff'};
    }
    
    th {
      padding: 12px 15px;
      text-align: left;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 0.75em;
    }
    
    td {
      padding: 12px 15px;
      border-bottom: 1px solid ${borderColor};
      font-size: 0.9em;
      color: ${textColor};
    }
    
    tbody tr {
      background: ${cardBg};
      transition: all 0.2s;
    }
    
    tbody tr:hover {
      background: ${hoverBg};
    }
    
    tbody tr:last-child td {
      border-bottom: none;
    }
    
    .photo-preview {
      max-width: 80px;
      height: auto;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .photo-preview:hover {
      transform: scale(1.05);
    }
    
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.9);
      animation: fadeIn 0.3s ease;
      padding: 20px;
    }
    
    .modal.active {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .modal-content {
      max-width: 90%;
      max-height: 90%;
      border-radius: 8px;
      animation: zoomIn 0.3s ease;
    }
    
    @keyframes zoomIn {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    
    .modal-close {
      position: absolute;
      top: 20px;
      right: 30px;
      color: white;
      font-size: 35px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s;
      z-index: 1001;
    }
    
    .modal-close:hover {
      transform: rotate(90deg);
    }
    
    .hidden { display: none !important; }
    
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
      .toolbar, .modal { display: none !important; }
      .summary-card:hover, tbody tr:hover { transform: none; }
    }
    
    @media (max-width: 768px) {
      body {
        padding: 10px 5px;
      }
      
      .header {
        padding: 20px 15px;
      }
      
      .toolbar {
        padding: 10px;
      }
      
      .search-box {
        width: 100%;
        max-width: 100%;
      }
      
      .toolbar-actions {
        width: 100%;
        justify-content: stretch;
      }
      
      .btn {
        flex: 1;
        justify-content: center;
        font-size: 12px;
        padding: 8px 12px;
      }
      
      .content {
        padding: 15px 10px;
      }
      
      .summary-grid {
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 10px;
      }
      
      .summary-card {
        padding: 12px;
      }
      
      .risk-banner {
        padding: 12px 15px;
        flex-direction: column;
        text-align: center;
      }
      
      .photo-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 10px;
      }
      
      .photo-card img {
        height: 120px;
      }
      
      th, td {
        padding: 10px 8px;
        font-size: 0.8em;
      }
      
      .photo-preview {
        max-width: 60px;
      }
      
      .modal-close {
        top: 10px;
        right: 15px;
        font-size: 30px;
      }
    }
    
    @media (max-width: 480px) {
      .summary-grid {
        grid-template-columns: 1fr;
      }
      
      .photo-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      table {
        min-width: 500px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-content">
        <h1>🔐 ${texts.title}</h1>
        <p>${texts.generatedAt}: ${new Date().toLocaleString()}</p>
      </div>
    </div>
    
    <div class="toolbar">
      <div class="search-box">
        <input type="text" id="searchInput" placeholder="${texts.searchPlaceholder}">
        <span class="search-icon">🔍</span>
      </div>
      <div class="toolbar-actions">
        <button class="btn btn-primary" onclick="window.print()">
          🖨️ ${texts.printReport}
        </button>
      </div>
    </div>
    
    <div class="content">
      <div class="risk-banner">
        <div class="icon">${risk.icon}</div>
        <div class="content-risk">
          <h3>${texts.riskLevel}: ${risk.level}</h3>
          <p>${filteredPhotos.length} ${texts.totalAttempts.toLowerCase()} â€¢ ${Object.keys(attemptsByUsername).length} ${texts.uniqueUsers.toLowerCase()}</p>
        </div>
      </div>
      
      <div class="section">
        <h2>${texts.summary}</h2>
        <div class="summary-grid">
          <div class="summary-card danger">
            <h3>${texts.totalAttempts}</h3>
            <p>${filteredPhotos.length}</p>
          </div>
          <div class="summary-card warning">
            <h3>${texts.uniqueUsers}</h3>
            <p>${Object.keys(attemptsByUsername).length}</p>
          </div>
          <div class="summary-card info">
            <h3>${texts.mostActiveUser}</h3>
            <p>${mostActiveUser ? mostActiveUser[0] : 'N/A'}</p>
          </div>
          <div class="summary-card success">
            <h3>${texts.peakHour}</h3>
            <p>${peakHourEntry ? `${peakHourEntry[0]}:00` : 'N/A'}</p>
          </div>
          ${activityStats ? `
          <div class="summary-card info">
            <h3>${texts.totalLogins}</h3>
            <p>${activityStats.total_logins}</p>
          </div>
          <div class="summary-card success">
            <h3>${texts.totalActions}</h3>
            <p>${activityStats.total_actions}</p>
          </div>
          <div class="summary-card warning">
            <h3>${texts.lastLogin}</h3>
            <p style="font-size: 1.2em;">${activityStats.last_login ? new Date(activityStats.last_login).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div class="summary-card danger">
            <h3>${texts.mostActiveDay}</h3>
            <p style="font-size: 1.2em;">${activityStats.most_active_day ? new Date(activityStats.most_active_day).toLocaleDateString() : 'N/A'}</p>
          </div>
          ` : ''}
        </div>
      </div>
      ${filteredPhotos.filter(p => p.photo_data && p.photo_data.startsWith('data:image')).length > 0 ? `
      <div class="section">
        <h2>📸 ${texts.photoGallery}</h2>
        <div class="photo-grid">
          ${filteredPhotos.filter(p => p.photo_data && p.photo_data.startsWith('data:image')).map(photo => `
            <div class="photo-card" onclick="openModal('${photo.photo_data}')">
              <img src="${photo.photo_data}" alt="Failed login attempt">
              <div class="info">
                <div class="username">${photo.username_attempt}</div>
                <div class="timestamp">${new Date(photo.timestamp).toLocaleString()}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
      <div class="section">
        <h2>${texts.detailedLog}</h2>
        <div class="table-wrapper">
          <table id="dataTable">
            <thead>
              <tr>
                <th>${texts.date}</th>
                <th>${texts.photo}</th>
                <th>${texts.username}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPhotos.map(photo => `
                <tr>
                  <td>${new Date(photo.timestamp).toLocaleString()}</td>
                  <td>
                    ${photo.photo_data && photo.photo_data.startsWith('data:image') 
                      ? `<img src="${photo.photo_data}" class="photo-preview" alt="Failed login photo" onclick="openModal('${photo.photo_data}')">`
                      : `<em>${texts.noPhoto}</em>`
                    }
                  </td>
                  <td><strong>${photo.username_attempt}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  <div id="photoModal" class="modal" onclick="closeModal()">
    <span class="modal-close" onclick="closeModal()">&times;</span>
    <img class="modal-content" id="modalImage">
  </div>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      initSearch();
    });
    function initSearch() {
      const searchInput = document.getElementById('searchInput');
      const table = document.getElementById('dataTable');
      const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
      searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        for (let row of rows) {
          const text = row.textContent.toLowerCase();
          row.style.display = text.includes(searchTerm) ? '' : 'none';
        }
      });
    }
    function openModal(src) {
      const modal = document.getElementById('photoModal');
      const modalImg = document.getElementById('modalImage');
      modal.classList.add('active');
      modalImg.src = src;
    }
    function closeModal() {
      document.getElementById('photoModal').classList.remove('active');
    }
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeModal();
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        window.print();
      }
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
      }
    });
  </script>
</body>
</html>`;
};
