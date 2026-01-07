/**
 * File Operations Utility
 * ファイル操作に関するユーティリティ関数
 * 要件: 3.1, 3.2, 3.3
 */

/**
 * タイムスタンプ付きファイル名を生成する
 * 要件: 3.2 - タイムスタンプ付きファイル名生成
 * 
 * @param prefix ファイル名のプレフィックス（デフォルト: 'markdown'）
 * @param extension ファイル拡張子（デフォルト: 'md'）
 * @returns タイムスタンプ付きファイル名
 */
export function generateTimestampedFilename(
  prefix: string = 'markdown',
  extension: string = 'md'
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;
  return `${prefix}_${timestamp}.${extension}`;
}

/**
 * テキストコンテンツを.mdファイルとしてダウンロードする
 * 要件: 3.1 - .mdファイルダウンロード機能
 * 
 * @param content ダウンロードするテキストコンテンツ
 * @param filename ファイル名（省略時は自動生成）
 * @returns ダウンロード成功時はtrue、失敗時はfalse
 */
export function downloadMarkdownFile(
  content: string,
  filename?: string
): boolean {
  try {
    // ファイル名が指定されていない場合は自動生成
    const finalFilename = filename || generateTimestampedFilename();
    
    // Blobオブジェクトを作成
    const blob = new Blob([content], {
      type: 'text/markdown;charset=utf-8'
    });
    
    // ダウンロード用のURLを作成
    const url = URL.createObjectURL(blob);
    
    // 一時的なaタグを作成してダウンロードを実行
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    link.style.display = 'none';
    
    // DOMに追加してクリック、その後削除
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // URLオブジェクトをクリーンアップ
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Failed to download markdown file:', error);
    return false;
  }
}

/**
 * テキストをクリップボードにコピーする
 * 要件: 3.3 - コード内容のクリップボードコピー
 * 
 * @param text コピーするテキスト
 * @returns コピー成功時はtrue、失敗時はfalse
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Clipboard APIが利用可能な場合
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // フォールバック: execCommandを使用
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return successful;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}