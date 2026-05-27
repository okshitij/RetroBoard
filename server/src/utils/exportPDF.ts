import puppeteer from 'puppeteer';
import Board from '../models/board.model';
import Note from '../models/note.model';

/**
 * Generate a PDF of a board with all its notes
 */
export async function generateBoardPDF(boardId: string): Promise<Buffer> {
  // Fetch board and notes
  const board = await Board.findById(boardId)
    .populate('owner', 'username email')
    .populate('members.userId', 'username email');

  if (!board) {
    throw new Error('Board not found');
  }

  const notes = await Note.find({ boardId })
    .populate('author', 'username email')
    .sort({ createdAt: 1 });

  // Group notes by column
  const notesByColumn = new Map<string, typeof notes>();
  for (const col of board.columns) {
    notesByColumn.set(col.id, []);
  }
  for (const note of notes) {
    const arr = notesByColumn.get(note.columnId);
    if (arr) arr.push(note);
  }

  // Build HTML
  const html = buildHTML(board, notesByColumn);

  // Generate PDF using Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

function buildHTML(board: any, notesByColumn: Map<string, any[]>): string {
  const columnsHTML = board.columns
    .sort((a: any, b: any) => a.order - b.order)
    .map((col: any) => {
      const colNotes = notesByColumn.get(col.id) || [];
      const notesHTML = colNotes
        .map((note: any) => {
          const authorName =
            typeof note.author === 'object' ? note.author.username : 'Unknown';
          const voteCount = note.votes?.length || 0;
          return `
            <div class="note">
              <p class="note-text">${escapeHtml(note.content)}</p>
              <div class="note-footer">
                <span class="note-author">— ${escapeHtml(authorName)}</span>
                ${voteCount > 0 ? `<span class="note-votes">👍 ${voteCount}</span>` : ''}
              </div>
            </div>
          `;
        })
        .join('');

      return `
        <div class="column">
          <div class="column-header">
            <h3>${escapeHtml(col.title)}</h3>
            <span class="note-count">${colNotes.length} note${colNotes.length !== 1 ? 's' : ''}</span>
          </div>
          <div class="column-body">
            ${notesHTML || '<p class="empty">No notes</p>'}
          </div>
        </div>
      `;
    })
    .join('');

  const ownerName =
    typeof board.owner === 'object' ? board.owner.username : 'Unknown';
  const createdDate = new Date(board.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(board.title)} — RetroBoard Export</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      padding: 32px;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e2e8f0;
    }
    .header h1 {
      font-size: 28px;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .header .sprint {
      font-size: 16px;
      color: #64748b;
      margin-bottom: 8px;
    }
    .header .meta {
      font-size: 12px;
      color: #94a3b8;
    }
    .columns {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }
    .column {
      flex: 1;
      background: white;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    .column-header {
      padding: 12px 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .column-header h3 {
      font-size: 14px;
      font-weight: 600;
    }
    .note-count {
      font-size: 11px;
      opacity: 0.85;
    }
    .column-body {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .note {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
    }
    .note-text {
      font-size: 13px;
      line-height: 1.5;
      color: #334155;
      margin-bottom: 6px;
      word-wrap: break-word;
    }
    .note-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #94a3b8;
    }
    .note-votes {
      background: #dcfce7;
      color: #166534;
      padding: 1px 6px;
      border-radius: 4px;
      font-weight: 500;
    }
    .empty {
      color: #94a3b8;
      font-size: 13px;
      text-align: center;
      padding: 16px 0;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(board.title)}</h1>
    <p class="sprint">Sprint: ${escapeHtml(board.sprintName)}</p>
    <p class="meta">Owner: ${escapeHtml(ownerName)} · Created: ${createdDate} · ${board.members.length} member${board.members.length !== 1 ? 's' : ''}</p>
  </div>
  <div class="columns">
    ${columnsHTML}
  </div>
  <div class="footer">
    Exported from RetroBoard on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
