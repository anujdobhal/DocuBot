// Maximum allowed file size: 25 MB
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_FILE_SIZE_MB = 25;

// Supported extensions and MIME types
export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
];

/**
 * Validates a file for upload (type and size)
 * @param {File} file
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateUploadFile(file) {
  if (!file) {
    return { isValid: false, error: 'Please select a file to upload.' };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));

  // Check MIME type if present (some browsers might omit MIME type for txt/docx)
  const hasValidMime = file.type ? ALLOWED_MIME_TYPES.includes(file.type) : true;

  if (!hasValidExt && !hasValidMime) {
    return {
      isValid: false,
      error: `Invalid file type. Only PDF, DOCX, and TXT files are supported.`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`,
    };
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: `Selected file is empty (0 bytes). Please select a valid document.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates login input
 * @param {string} emailOrUser
 * @param {string} password
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateLoginInput(emailOrUser, password) {
  if (!emailOrUser || !emailOrUser.trim()) {
    return { isValid: false, error: 'Please enter your email or username.' };
  }
  if (!password || !password.trim()) {
    return { isValid: false, error: 'Please enter your password.' };
  }
  return { isValid: true };
}
