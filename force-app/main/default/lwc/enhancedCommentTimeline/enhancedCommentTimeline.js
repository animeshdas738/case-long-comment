import { LightningElement, api, track } from 'lwc';

export default class EnhancedCommentTimeline extends LightningElement {
  @api recordId;
  @track comments = [];
  @track pageSize = 10;
  pageNumber = 1;
  searchText = '';

  pageSizeOptions = [
    { label: '5', value: '5' },
    { label: '10', value: '10' },
    { label: '25', value: '25' }
  ];

  connectedCallback() {
    this.loadComments();
    this.template.addEventListener('savecomment', this.handleSaveComment.bind(this));
  }

  handleSaveComment(event) {
    // event.detail contains comment payload; refresh list after a short delay
    setTimeout(() => this.loadComments(), 500);
  }

  handleSearch(event) {
    this.searchText = event.target.value;
    this.pageNumber = 1;
    this.loadComments();
  }

  handlePageSizeChange(event) {
    this.pageSize = parseInt(event.target.value, 10);
    this.pageNumber = 1;
    this.loadComments();
  }

  async loadComments() {
    // Placeholder: call Apex to fetch comments for recordId with pagination and search
    // For now, we'll emit a request event so parent app can handle server calls
    this.dispatchEvent(new CustomEvent('requestcomments', { detail: { recordId: this.recordId, pageNumber: this.pageNumber, pageSize: this.pageSize, searchText: this.searchText } }));
  }

  handlePrev() {
    if (this.pageNumber > 1) {
      this.pageNumber--;
      this.loadComments();
    }
  }

  handleNext() {
    this.pageNumber++;
    this.loadComments();
  }

  get isPrevDisabled() {
    return this.pageNumber <= 1;
  }

  // Simple heuristic: disable next if less than page size fetched
  get isNextDisabled() {
    return !(this.comments && this.comments.length === this.pageSize);
  }
}
