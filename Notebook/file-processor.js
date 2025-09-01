/**
 * File Processor for Vincent E Neu
 * Handles file upload, OCR, and content extraction
 */

class FileProcessor {
    constructor() {
        this.supportedTypes = {
            'application/pdf': 'pdf',
            'application/msword': 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'text/plain': 'txt'
        };
        
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
    }

    /**
     * Process uploaded file
     * @param {File} file - The file to process
     * @returns {Promise<Object>} Processed file data
     */
    async processFile(file) {
        try {
            // Validate file
            this.validateFile(file);
            
            // Extract content based on file type
            const content = await this.extractContent(file);
            
            // Detect subject from content and filename
            const subject = this.detectSubject(file.name, content);
            
            // Generate metadata
            const metadata = this.generateMetadata(file, content, subject);
            
            return {
                success: true,
                data: {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    uploadDate: new Date().toISOString(),
                    subject: subject,
                    content: content,
                    metadata: metadata,
                    status: 'processed'
                }
            };
            
        } catch (error) {
            console.error('File processing error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Validate file type and size
     * @param {File} file - File to validate
     */
    validateFile(file) {
        if (!this.supportedTypes[file.type]) {
            throw new Error(`File type not supported: ${file.type}`);
        }
        
        if (file.size > this.maxFileSize) {
            throw new Error(`File too large: ${this.formatFileSize(file.size)}. Maximum: ${this.formatFileSize(this.maxFileSize)}`);
        }
    }

    /**
     * Extract content from file
     * @param {File} file - File to extract content from
     * @returns {Promise<string>} Extracted text content
     */
    async extractContent(file) {
        const fileType = this.supportedTypes[file.type];
        
        switch (fileType) {
            case 'txt':
                return await this.extractTextContent(file);
            case 'pdf':
                return await this.extractPDFContent(file);
            case 'doc':
            case 'docx':
                return await this.extractWordContent(file);
            default:
                throw new Error(`Unsupported file type: ${fileType}`);
        }
    }

    /**
     * Extract text from plain text file
     * @param {File} file - Text file
     * @returns {Promise<string>} File content
     */
    async extractTextContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read text file'));
            reader.readAsText(file);
        });
    }

    /**
     * Extract text from PDF file using PDF.js
     * @param {File} file - PDF file
     * @returns {Promise<string>} Extracted text
     */
    async extractPDFContent(file) {
        try {
            // Load PDF.js library dynamically
            if (!window.pdfjsLib) {
                await this.loadPDFJS();
            }
            
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            let fullText = '';
            
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }
            
            return fullText.trim();
            
        } catch (error) {
            console.warn('PDF text extraction failed, using OCR fallback:', error);
            return await this.extractWithOCR(file);
        }
    }

    /**
     * Extract text from Word documents
     * @param {File} file - Word document
     * @returns {Promise<string>} Extracted text
     */
    async extractWordContent(file) {
        try {
            // For now, return a placeholder since Word parsing requires additional libraries
            // In production, you'd use mammoth.js or similar
            return `[Word Document Content]\n\nFile: ${file.name}\nSize: ${this.formatFileSize(file.size)}\n\nThis is a placeholder for Word document content. In a production environment, this would be extracted using mammoth.js or similar library.`;
            
        } catch (error) {
            console.warn('Word document extraction failed:', error);
            return await this.extractWithOCR(file);
        }
    }

    /**
     * Extract text using OCR (Tesseract.js)
     * @param {File} file - File to OCR
     * @returns {Promise<string>} OCR extracted text
     */
    async extractWithOCR(file) {
        try {
            // Load Tesseract.js dynamically
            if (!window.Tesseract) {
                await this.loadTesseract();
            }
            
            const result = await window.Tesseract.recognize(file, 'vie+eng', {
                logger: m => console.log(m)
            });
            
            return result.data.text;
            
        } catch (error) {
            console.error('OCR extraction failed:', error);
            throw new Error('Failed to extract text from file. Please ensure the file contains readable text.');
        }
    }

    /**
     * Load PDF.js library
     */
    async loadPDFJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Load Tesseract.js library
     */
    async loadTesseract() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Detect subject from filename and content
     * @param {string} filename - File name
     * @param {string} content - File content
     * @returns {string} Detected subject
     */
    detectSubject(filename, content) {
        const text = (filename + ' ' + content).toLowerCase();
        
        // Subject keywords
        const subjects = {
            'toanHoc': ['toán', 'math', 'đại số', 'giải tích', 'hình học', 'số học', 'đại số tuyến tính'],
            'vanHoc': ['văn', 'van', 'văn học', 'literature', 'tiếng việt', 'ngữ văn', 'văn chương'],
            'tiengAnh': ['anh', 'english', 'tiếng anh', 'ngữ pháp', 'từ vựng', 'ielts', 'toeic'],
            'vatLy': ['lý', 'physics', 'vật lý', 'cơ học', 'điện học', 'quang học', 'nhiệt học']
        };
        
        // Count matches for each subject
        const scores = {};
        for (const [subject, keywords] of Object.entries(subjects)) {
            scores[subject] = keywords.reduce((score, keyword) => {
                return score + (text.includes(keyword) ? 1 : 0);
            }, 0);
        }
        
        // Return subject with highest score
        const bestSubject = Object.entries(scores).reduce((best, [subject, score]) => {
            return score > best.score ? { subject, score } : best;
        }, { subject: 'toanHoc', score: 0 });
        
        return bestSubject.subject;
    }

    /**
     * Generate metadata for the file
     * @param {File} file - Original file
     * @param {string} content - Extracted content
     * @param {string} subject - Detected subject
     * @returns {Object} Metadata
     */
    generateMetadata(file, content, subject) {
        const wordCount = content.split(/\s+/).length;
        const charCount = content.length;
        const lineCount = content.split('\n').length;
        
        // Extract potential exam information
        const examInfo = this.extractExamInfo(content);
        
        return {
            wordCount,
            charCount,
            lineCount,
            subject,
            examInfo,
            processingTime: new Date().toISOString(),
            fileType: this.supportedTypes[file.type]
        };
    }

    /**
     * Extract exam information from content
     * @param {string} content - File content
     * @returns {Object} Exam information
     */
    extractExamInfo(content) {
        const info = {
            year: null,
            semester: null,
            examType: null,
            duration: null,
            totalPoints: null
        };
        
        // Extract year
        const yearMatch = content.match(/(?:năm|year)\s*(\d{4})/i);
        if (yearMatch) info.year = yearMatch[1];
        
        // Extract semester
        const semesterMatch = content.match(/(?:học kỳ|semester)\s*([12])/i);
        if (semesterMatch) info.semester = semesterMatch[1];
        
        // Extract exam type
        if (content.includes('giữa kỳ')) info.examType = 'midterm';
        else if (content.includes('cuối kỳ')) info.examType = 'final';
        else if (content.includes('kiểm tra')) info.examType = 'quiz';
        else info.examType = 'exam';
        
        // Extract duration
        const durationMatch = content.match(/(\d+)\s*(?:phút|minute)/i);
        if (durationMatch) info.duration = durationMatch[1];
        
        // Extract total points
        const pointsMatch = content.match(/(\d+)\s*(?:điểm|point)/i);
        if (pointsMatch) info.totalPoints = pointsMatch[1];
        
        return info;
    }

    /**
     * Format file size
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get subject name
     * @param {string} subject - Subject code
     * @returns {string} Subject name
     */
    getSubjectName(subject) {
        const subjects = {
            'toanHoc': 'Toán cao cấp',
            'vanHoc': 'Văn học đại cương',
            'tiengAnh': 'Tiếng Anh đại học',
            'vatLy': 'Vật lý đại cương'
        };
        return subjects[subject] || 'Khác';
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileProcessor;
} else {
    window.FileProcessor = FileProcessor;
}

