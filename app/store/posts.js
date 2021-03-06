import moment from '~/plugins/moment'

export const state = () => ({
  posts: [],
})

export const getters = {
  posts: (state) =>
    state.posts.map((post) => Object.assign({ likes: [] }, post)),
}

export const mutations = {
  addPost(state, { post }) {
    state.posts.push(post)
  },

  updatePost(state, { post }) {
    state.posts = state.posts.map((p) => (p.id === post.id ? post : p))
  },

  clearPosts(state) {
    state.posts = []
  },
}

export const actions = {
  async fetchPost({ commit }, { id }) {
    const post = await this.$axios.$get(`/posts/${id}.json`)
    commit('addPost', { post: { ...post, id } })
  },

  async fetchPosts({ commit }) {
    const posts = await this.$axios.$get(`/posts.json`)
    commit('clearPosts')
    Object.entries(posts || [])
      .reverse()
      .forEach(([id, content]) =>
        commit('addPost', {
          post: {
            id,
            ...content,
          },
        })
      )
  },

  async publishPost({ commit }, { payload }) {
    const user = await this.$axios.$get(`/users/${payload.user.id}.json`)
    const createdAt = moment().format()
    payload = {
      createdAt,
      ...payload,
    }
    const postID = (await this.$axios.$post('/posts.json', payload)).name
    const post = { id: postID, ...payload, createdAt }
    const putData = { id: postID, ...payload, createdAt }
    delete putData.user
    await this.$axios.$put(`/users/${user.id}/posts.json`, [
      ...(user.posts || []),
      putData,
    ])
    commit('addPost', { post })
  },

  async addLikeToPost({ commit }, { user, post }) {
    post.likes.push({
      createdAt: moment().format(),
      userID: user.id,
      postID: post.id,
    })
    const newPost = await this.$axios.$put(`/posts/${post.id}.json`, post)
    commit('updatePost', { post: newPost })
  },

  async removeLikeToPost({ commit }, { user, post }) {
    post.likes = post.likes.filter((like) => like.userID !== user.id) || []
    const newPost = await this.$axios.$put(`/posts/${post.id}.json`, post)
    commit('updatePost', { post: newPost })
  },
}
