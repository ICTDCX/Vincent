/**
 * Search System for Vincent E Neu
 * Handles file search, content search, and filtering
 */

class SearchSystem {
    constructor() {
        this.searchIndex = new Map();
        this.filters = {
            subject: null,
            dateRange: null,
            fileType: null,
            examType: null
        };
    }

    /**
     * Build search index from files
     * @param {Array} files - Array of file objects
     */
    buildSearchIndex(files) {
        this.searchIndex.clear();
        
        files.forEach((file, index) => {
            // Index by filename
            this.addToIndex(file.name.toLowerCase(), index);
            
            // Index by content
            if (file.content) {
                this.addToIndex(file.content.toLowerCase(), index);
            }
            
            // Index by subject
            if (file.subject) {
                this.addToIndex(file.subject.toLowerCase(), index);
            }
            
            // Index by metadata
            if (file.metadata) {
                if (file.metadata.examInfo) {
                    Object.values(file.metadata.examInfo).forEach(value => {
                        if (value) this.addToIndex(value.toString().toLowerCase(), index);
                    });
                }
            }
        });
    }

    /**
     * Add terms to search index
     * @param {string} text - Text to index
     * @param {number} fileIndex - File index
     */
    addToIndex(text, fileIndex) {
        const words = text.split(/\s+/).filter(word => word.length > 2);
        
        words.forEach(word => {
            if (!this.searchIndex.has(word)) {
                this.searchIndex.set(word, new Set());
            }
            this.searchIndex.get(word).add(fileIndex);
        });
    }

    /**
     * Search files with query and filters
     * @param {string} query - Search query
     * @param {Object} filters - Search filters
     * @param {Array} files - Files to search in
     * @returns {Array} Search results
     */
    search(query, filters = {}, files = []) {
        if (!query && Object.keys(filters).length === 0) {
            return files;
        }

        let results = new Set();
        
        // Text search
        if (query && query.trim()) {
            const searchTerms = query.toLowerCase().split(/\s+/);
            const textResults = this.searchByText(searchTerms, files);
            results = new Set(textResults);
        } else {
            // If no text query, include all files for filtering
            results = new Set(files.map((_, index) => index));
        }

        // Apply filters
        if (filters.subject) {
            results = this.filterBySubject(results, filters.subject, files);
        }
        
        if (filters.dateRange) {
            results = this.filterByDateRange(results, filters.dateRange, files);
        }
        
        if (filters.fileType) {
            results = this.filterByFileType(results, filters.fileType, files);
        }
        
        if (filters.examType) {
            results = this.filterByExamType(results, filters.examType, files);
        }

        // Convert back to file objects
        return Array.from(results).map(index => files[index]).filter(Boolean);
    }

    /**
     * Search by text content
     * @param {Array} searchTerms - Search terms
     * @param {Array} files - Files to search
     * @returns {Array} Matching file indices
     */
    searchByText(searchTerms, files) {
        const matches = new Set();
        
        searchTerms.forEach(term => {
            if (this.searchIndex.has(term)) {
                this.searchIndex.get(term).forEach(fileIndex => {
                    matches.add(fileIndex);
                });
            }
        });

        // Also search in file content directly for better results
        files.forEach((file, index) => {
            const fileText = `${file.name} ${file.content || ''} ${file.subject || ''}`.toLowerCase();
            const hasAllTerms = searchTerms.every(term => fileText.includes(term));
            if (hasAllTerms) {
                matches.add(index);
            }
        });

        return Array.from(matches);
    }

    /**
     * Filter by subject
     * @param {Set} results - Current results
     * @param {string} subject - Subject filter
     * @param {Array} files - Files array
     * @returns {Set} Filtered results
     */
    filterBySubject(results, subject, files) {
        const filtered = new Set();
        results.forEach(index => {
            if (files[index] && files[index].subject === subject) {
                filtered.add(index);
            }
        });
        return filtered;
    }

    /**
     * Filter by date range
     * @param {Set} results - Current results
     * @param {Object} dateRange - Date range filter
     * @param {Array} files - Files array
     * @returns {Set} Filtered results
     */
    filterByDateRange(results, dateRange, files) {
        const filtered = new Set();
        const { start, end } = dateRange;
        
        results.forEach(index => {
            if (files[index] && files[index].uploadDate) {
                const uploadDate = new Date(files[index].uploadDate);
                const isInRange = (!start || uploadDate >= new Date(start)) &&
                                 (!end || uploadDate <= new Date(end));
                if (isInRange) {
                    filtered.add(index);
                }
            }
        });
        return filtered;
    }

    /**
     * Filter by file type
     * @param {Set} results - Current results
     * @param {string} fileType - File type filter
     * @param {Array} files - Files array
     * @returns {Set} Filtered results
     */
    filterByFileType(results, fileType, files) {
        const filtered = new Set();
        results.forEach(index => {
            if (files[index] && files[index].type === fileType) {
                filtered.add(index);
            }
        });
        return filtered;
    }

    /**
     * Filter by exam type
     * @param {Set} results - Current results
     * @param {string} examType - Exam type filter
     * @param {Array} files - Files array
     * @returns {Set} Filtered results
     */
    filterByExamType(results, examType, files) {
        const filtered = new Set();
        results.forEach(index => {
            if (files[index] && 
                files[index].metadata && 
                files[index].metadata.examInfo &&
                files[index].metadata.examInfo.examType === examType) {
                filtered.add(index);
            }
        });
        return filtered;
    }

    /**
     * Get search suggestions
     * @param {string} query - Partial query
     * @param {Array} files - Files to search in
     * @returns {Array} Suggestions
     */
    getSuggestions(query, files = []) {
        if (!query || query.length < 2) return [];
        
        const suggestions = new Set();
        const queryLower = query.toLowerCase();
        
        // Search in filenames
        files.forEach(file => {
            if (file.name.toLowerCase().includes(queryLower)) {
                suggestions.add(file.name);
            }
        });
        
        // Search in subjects
        const subjects = ['toanHoc', 'vanHoc', 'tiengAnh', 'vatLy'];
        subjects.forEach(subject => {
            if (subject.toLowerCase().includes(queryLower)) {
                suggestions.add(this.getSubjectName(subject));
            }
        });
        
        // Search in exam types
        const examTypes = ['midterm', 'final', 'quiz', 'exam'];
        examTypes.forEach(type => {
            if (type.toLowerCase().includes(queryLower)) {
                suggestions.add(type);
            }
        });
        
        return Array.from(suggestions).slice(0, 10);
    }

    /**
     * Highlight search terms in text
     * @param {string} text - Text to highlight
     * @param {string} query - Search query
     * @returns {string} Highlighted text
     */
    highlightSearchTerms(text, query) {
        if (!query || !text) return text;
        
        const terms = query.split(/\s+/).filter(term => term.length > 0);
        let highlightedText = text;
        
        terms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        });
        
        return highlightedText;
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
        return subjects[subject] || subject;
    }

    /**
     * Get available filters
     * @param {Array} files - Files array
     * @returns {Object} Available filters
     */
    getAvailableFilters(files) {
        const filters = {
            subjects: new Set(),
            fileTypes: new Set(),
            examTypes: new Set(),
            years: new Set()
        };
        
        files.forEach(file => {
            if (file.subject) filters.subjects.add(file.subject);
            if (file.type) filters.fileTypes.add(file.type);
            if (file.metadata && file.metadata.examInfo) {
                if (file.metadata.examInfo.examType) {
                    filters.examTypes.add(file.metadata.examInfo.examType);
                }
                if (file.metadata.examInfo.year) {
                    filters.years.add(file.metadata.examInfo.year);
                }
            }
        });
        
        return {
            subjects: Array.from(filters.subjects),
            fileTypes: Array.from(filters.fileTypes),
            examTypes: Array.from(filters.examTypes),
            years: Array.from(filters.years).sort((a, b) => b - a)
        };
    }

    /**
     * Save search history
     * @param {string} query - Search query
     */
    saveSearchHistory(query) {
        if (!query || query.trim().length === 0) return;
        
        const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        const trimmedQuery = query.trim();
        
        // Remove if already exists
        const index = history.indexOf(trimmedQuery);
        if (index > -1) {
            history.splice(index, 1);
        }
        
        // Add to beginning
        history.unshift(trimmedQuery);
        
        // Keep only last 10 searches
        if (history.length > 10) {
            history.splice(10);
        }
        
        localStorage.setItem('searchHistory', JSON.stringify(history));
    }

    /**
     * Get search history
     * @returns {Array} Search history
     */
    getSearchHistory() {
        return JSON.parse(localStorage.getItem('searchHistory') || '[]');
    }

    /**
     * Clear search history
     */
    clearSearchHistory() {
        localStorage.removeItem('searchHistory');
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchSystem;
} else {
    window.SearchSystem = SearchSystem;
}

