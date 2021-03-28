// Api.js
import axios from 'axios'

// Create a instance of axios to use the same base url.
const axiosAPI = axios.create({})

axiosAPI.interceptors.request.use(config => {
  console.log({ config })
  config.url = 'http://localhost:8080/' + config.url
  return config
})

// implement a method to execute all the request from here.
const apiRequest = (method, url, request) => {
  //using the axios instance to perform the request that received from each http method
  return axiosAPI({
    method,
    url,
    data: request
  })
    .then(res => {
      return Promise.resolve(res.data)
    })
    .catch(err => {
      return Promise.reject(err)
    })
}

// function to execute the http get request
const get = (url, request) => apiRequest('get', url, request)

// function to execute the http delete request
const deleteRequest = (url, request) => apiRequest('delete', url, request)

// function to execute the http post request
const post = (url, request) => apiRequest('post', url, request)

// function to execute the http put request
const put = (url, request) => apiRequest('put', url, request)

// function to execute the http path request
const patch = (url, request) => apiRequest('patch', url, request)

// expose your method to other services or actions
const API = {
  get,
  delete: deleteRequest,
  post,
  put,
  patch
}
export default API
