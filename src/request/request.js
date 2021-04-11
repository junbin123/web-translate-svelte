// Api.js
import axios from 'axios'
const axiosAPI = axios.create({})

axiosAPI.interceptors.request.use(config => {
  console.log({ config })
  // config.url = 'http://localhost:8080/' + config.url
  config.headers['Content-Type'] = 'application/json;charset=UTF-8'
  return config
})

const apiRequest = (method, url, request, headers = {}) => {
  return axiosAPI({
    method,
    url,
    data: request,
    headers
  })
    .then(res => {
      return Promise.resolve(res.data)
    })
    .catch(err => {
      return Promise.reject(err)
    })
}

// function to execute the http get request
const get = (url, request, headers) => apiRequest('get', url, request, headers)

// function to execute the http delete request
const deleteRequest = (url, request, headers) => apiRequest('delete', url, request, headers)

// function to execute the http post request
const post = (url, request, headers) => apiRequest('post', url, request, headers)

// function to execute the http put request
const put = (url, request, headers) => apiRequest('put', url, request, headers)

// function to execute the http path request
const patch = (url, request, headers) => apiRequest('patch', url, request, headers)

// expose your method to other services or actions
const API = {
  get,
  delete: deleteRequest,
  post,
  put,
  patch
}
export default API
