import {defineStore} from 'pinia'
import {useOpnFetch} from "~/composables/useOpnFetch.js"
import {useStorage} from "@vueuse/core"

export const workspaceEndpoint = 'open/workspaces/'

const storedWorkspaceId = useStorage('currentWorkspace', 0)

export const useWorkspacesStore = defineStore('workspaces', {
  state: () => ({
    content: [],
    currentId: null,
    loading: false
  }),
  getters: {
    getById: (state) => (id) => {
      if (state.content.length === 0) return null
      return state.content.find(item => item.id === id)
    },
    getCurrent: (state) => () => {
      if (state.content.length === 0 || state.currentId === null) return null
      return state.content.find(item => item.id === state.currentId)
    }
  },
  actions: {
    set(items) {
      this.content = items
      if (this.currentId == null && this.content.length > 0) {
        // If one only, set it
        if (this.content.length === 1) {
          this.setCurrentId(items[0].id)
        } else if (storedWorkspaceId && this.content.find(item => item.id === parseInt(storedWorkspaceId.value))) {
          // Check local storage for current workspace, or take first
          this.setCurrentId(parseInt(storedWorkspaceId.value))
        } else {
          // Else, take first
          this.setCurrentId(items[0].id)
        }
      } else {
        this.setCurrentId(null)
      }
    },
    setCurrentId(id) {
      this.currentId = id
      storedWorkspaceId.value = id
    },
    addOrUpdate(item) {
      this.content = this.content.filter((val) => val.id !== item.id)
      this.content.push(item)
      if (this.currentId == null) {
        this.currentId = item.id
        storedWorkspaceId.value = this.currentId
      }
    },
    remove(itemId) {
      this.content = this.content.filter((val) => val.id !== itemId)
      if (this.currentId === itemId) {
        this.setCurrentId(this.content.length > 0 ? this.content[0].id : null)
      }
    },
    startLoading() {
      this.loading = true
    },
    stopLoading() {
      this.loading = false
    },
    resetState() {
      this.set([])
      this.stopLoading()
    },
    load() {
      this.set([])
      this.startLoading()
      return useOpnFetch(workspaceEndpoint,{server: false}).then(({data,error}) => {
        console.log(data,error)
        this.set(data)
        this.stopLoading()
      })
    },
    loadIfEmpty() {
      if (this.content.length === 0) {
        return this.load()
      }
      return Promise.resolve()
    },
    delete(id) {
      this.startLoading()
      return useOpnFetch(workspaceEndpoint + id, {method: 'DELETE'}).then((response) => {
        this.remove(response.data.workspace_id)
        this.stopLoading()
      })
    }
  }
})