/* Vue owns the Assignment Tracker table, filters, summaries and edit/delete dialogs. */
(() => {
  'use strict';
  const workspace = window.PundanaWorkspace;
  const store = window.PundanaData;
  const startupError = document.getElementById('vue-startup-error');
  if (!window.Vue || !workspace || !store) {
    startupError.hidden = false;
    startupError.textContent = 'Assignment Tracker could not load. Reload the page and check that the application files are installed.';
    return;
  }

  const app = window.Vue.createApp({
    data() {
      return {
        records: store.empty(),
        recordsAvailable: false,
        search: '',
        subjectFilter: '',
        statusFilter: '',
        statusLabels: {todo:'Not started', doing:'In progress', done:'Completed'},
        currentDate: new Date(),
        noticeMessage: '',
        noticeIsError: false,
        editingId: null,
        draft: {title:'', subjectId:'', dueDate:'', status:'todo', notes:''},
        formError: '',
        pendingDelete: null,
        deleteError: '',
        refreshTimer: null
      };
    },
    computed: {
      summary() {
        return store.summarize(this.records, this.currentDate);
      },
      summaryCards() {
        return [
          {value:this.summary.total, label:'Total assignments'},
          {value:this.summary.active, label:'Active assignments'},
          {value:this.summary.overdue, label:'Overdue'},
          {value:this.summary.completion === null ? '—' : this.summary.completion + '%', label:'Completed'}
        ];
      },
      filteredAssignments() {
        const query = this.search.trim().toLowerCase();
        return this.records.assignments.filter(assignment => {
          const subject = this.records.subjects.find(item => item.id === assignment.subjectId);
          const searchable = [assignment.title, assignment.notes, subject?.code, subject?.name].join(' ').toLowerCase();
          const matchesSearch = searchable.includes(query);
          const matchesSubject = !this.subjectFilter || assignment.subjectId === this.subjectFilter;
          const matchesStatus = !this.statusFilter || (this.statusFilter === 'overdue'
            ? this.isOverdue(assignment)
            : assignment.status === this.statusFilter);
          return matchesSearch && matchesSubject && matchesStatus;
        }).sort((first, second) => first.dueDate.localeCompare(second.dueDate));
      }
    },
    methods: {
      showNotice(message, error = false) {
        this.noticeMessage = message;
        this.noticeIsError = error;
      },
      refreshRecords() {
        const user = workspace.user();
        if (!user) return false;
        this.currentDate = new Date();
        try {
          this.records = store.load(user.id);
          this.recordsAvailable = true;
          if (this.subjectFilter && !this.records.subjects.some(subject => subject.id === this.subjectFilter)) {
            this.subjectFilter = '';
          }
          return true;
        } catch (error) {
          this.records = store.empty();
          this.recordsAvailable = false;
          this.showNotice('Unable to read academic records. ' + workspace.errorMessage(error), true);
          return false;
        }
      },
      subjectLabel(subjectId) {
        return this.records.subjects.find(subject => subject.id === subjectId)?.code || 'Subject unavailable';
      },
      formatDate(value) {
        return new Date(value + 'T12:00:00').toLocaleDateString('en-MY', {day:'numeric', month:'short', year:'numeric'});
      },
      isOverdue(assignment) {
        return assignment.status !== 'done' && assignment.dueDate < this.summary.today;
      },
      async openEditor(assignmentId = null) {
        if (!this.refreshRecords()) return;
        if (!this.records.subjects.length) {
          this.showNotice('Add a subject on My Subjects before creating an assignment.', true);
          return;
        }
        const assignment = assignmentId ? this.records.assignments.find(item => item.id === assignmentId) : null;
        if (assignmentId && !assignment) {
          this.showNotice('This assignment no longer exists. The list has been refreshed.', true);
          return;
        }
        this.editingId = assignmentId;
        this.draft = {
          title: assignment?.title || '',
          subjectId: assignment?.subjectId || '',
          dueDate: assignment?.dueDate || '',
          status: assignment?.status || 'todo',
          notes: assignment?.notes || ''
        };
        this.formError = '';
        await this.$nextTick();
        this.$refs.recordDialog.showModal();
      },
      closeEditor() {
        this.$refs.recordDialog.close();
      },
      recordDialogClosed() {
        this.formError = '';
      },
      saveRecord() {
        const user = workspace.user();
        if (!user || !this.$refs.recordForm.reportValidity()) return;
        try {
          store.saveAssignment(user.id, {...this.draft}, this.editingId);
          this.closeEditor();
          this.refreshRecords();
          this.showNotice('Your assignment was saved. Dashboard updated.');
        } catch (error) {
          this.formError = workspace.errorMessage(error);
        }
      },
      openDelete(assignmentId) {
        if (!this.refreshRecords()) return;
        const assignment = this.records.assignments.find(item => item.id === assignmentId);
        if (!assignment) {
          this.showNotice('This assignment no longer exists. The list has been refreshed.', true);
          return;
        }
        this.pendingDelete = {id:assignment.id, title:assignment.title};
        this.deleteError = '';
        this.$refs.deleteDialog.showModal();
      },
      closeDelete() {
        this.$refs.deleteDialog.close();
      },
      deleteDialogClosed() {
        this.pendingDelete = null;
        this.deleteError = '';
      },
      deleteRecord() {
        const user = workspace.user();
        if (!user || !this.pendingDelete) return;
        try {
          store.deleteAssignment(user.id, this.pendingDelete.id);
          this.closeDelete();
          this.refreshRecords();
          this.showNotice('Assignment deleted. Dashboard updated.');
        } catch (error) {
          this.deleteError = workspace.errorMessage(error);
        }
      }
    },
    mounted() {
      workspace.init(this.refreshRecords);
      this.refreshTimer = window.setInterval(this.refreshRecords, 60000);
    },
    beforeUnmount() {
      window.clearInterval(this.refreshTimer);
    }
  });
  app.mount('#main-content');
})();
