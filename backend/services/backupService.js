const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

/**
 * Database Backup Utility
 * Provides functions to backup and restore MySQL databases
 */

class BackupService {
  constructor(config) {
    this.dbHost = config.host || 'localhost';
    this.dbPort = config.port || 3306;
    this.dbUser = config.user || 'root';
    this.dbPassword = config.password || 'root';
    this.dbName = config.database || 'testtrack';
    this.backupDir = path.join(__dirname, '..', 'backups');
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Create a database backup
   * @param {string} backupName - Name for the backup file
   * @returns {Promise<Object>} Backup details
   */
  async createBackup(backupName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${backupName || 'backup'}_${timestamp}.sql`;
    const filePath = path.join(this.backupDir, fileName);
    
    try {
      // Determine mysqldump command based on OS
      let mysqldumpCmd = 'mysqldump';
      
      // On Windows, try to find mysqldump in common MySQL installation paths
      if (process.platform === 'win32') {
        const commonPaths = [
          'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
          'C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysqldump.exe',
          'C:\\Program Files (x86)\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
          'C:\\xampp\\mysql\\bin\\mysqldump.exe'
        ];
        
        for (const testPath of commonPaths) {
          if (fs.existsSync(testPath)) {
            mysqldumpCmd = `"${testPath}"`;
            break;
          }
        }
      }
      
      // Build mysqldump command
      const command = `${mysqldumpCmd} -h ${this.dbHost} -P ${this.dbPort} -u ${this.dbUser} -p${this.dbPassword} ${this.dbName} > "${filePath}"`;
      
      console.log(`🔄 Starting database backup: ${fileName}`);
      
      // Execute mysqldump
      await execPromise(command);
      
      // Get file stats
      const stats = fs.statSync(filePath);
      const fileSizeInBytes = stats.size;
      const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
      
      console.log(`✅ Backup completed: ${fileName} (${fileSizeInMB} MB)`);
      
      return {
        success: true,
        fileName,
        filePath,
        fileSize: fileSizeInBytes,
        fileSizeMB: fileSizeInMB,
        createdAt: new Date()
      };
      
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      
      // Clean up failed backup file if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  /**
   * Restore database from a backup file
   * @param {string} fileName - Backup file name
   * @returns {Promise<Object>} Restore result
   */
  async restoreBackup(fileName) {
    const filePath = path.join(this.backupDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup file not found: ${fileName}`);
    }
    
    try {
      console.log(`🔄 Starting database restore from: ${fileName}`);
      
      // Determine mysql command based on OS
      let mysqlCmd = 'mysql';
      
      // On Windows, try to find mysql in common MySQL installation paths
      if (process.platform === 'win32') {
        const commonPaths = [
          'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe',
          'C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysql.exe',
          'C:\\Program Files (x86)\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe',
          'C:\\xampp\\mysql\\bin\\mysql.exe'
        ];
        
        for (const testPath of commonPaths) {
          if (fs.existsSync(testPath)) {
            mysqlCmd = `"${testPath}"`;
            break;
          }
        }
      }
      
      // Build mysql restore command
      const command = `${mysqlCmd} -h ${this.dbHost} -P ${this.dbPort} -u ${this.dbUser} -p${this.dbPassword} ${this.dbName} < "${filePath}"`;
      
      // Execute restore
      await execPromise(command);
      
      console.log(`✅ Database restored successfully from: ${fileName}`);
      
      return {
        success: true,
        fileName,
        restoredAt: new Date()
      };
      
    } catch (error) {
      console.error('❌ Restore failed:', error.message);
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  /**
   * Delete a backup file
   * @param {string} fileName - Backup file name
   * @returns {boolean} Success status
   */
  deleteBackupFile(fileName) {
    const filePath = path.join(this.backupDir, fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted backup file: ${fileName}`);
      return true;
    }
    
    return false;
  }

  /**
   * Get backup file information
   * @param {string} fileName - Backup file name
   * @returns {Object|null} File info
   */
  getBackupFileInfo(fileName) {
    const filePath = path.join(this.backupDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const stats = fs.statSync(filePath);
    
    return {
      fileName,
      filePath,
      fileSize: stats.size,
      fileSizeMB: (stats.size / (1024 * 1024)).toFixed(2),
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    };
  }

  /**
   * List all backup files
   * @returns {Array<Object>} List of backup files
   */
  listBackupFiles() {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }
    
    const files = fs.readdirSync(this.backupDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => this.getBackupFileInfo(file))
      .filter(info => info !== null)
      .sort((a, b) => b.createdAt - a.createdAt);
    
    return files;
  }
}

module.exports = BackupService;
