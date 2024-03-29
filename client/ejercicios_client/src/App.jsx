import { useState, useEffect } from 'react'
import loggedInContext from './context/loggedInContext';
import './App.scss'
import router from './routes/Router.jsx'
import { RouterProvider } from 'react-router-dom'
import { refreshAuth,logout as logoutApi } from './util/api/auth'


function App() {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState(null);
  const [isCheckingLogin, setIsCheckingLogin] = useState(true);
  useEffect(() => {
    refreshAuth().then((data) => {
      if (!data.error) {
        setIsLogged(true);
        setUser(data.user);
      }
      else {
        setIsLogged(false);
        setUser(null);
      }
      setIsCheckingLogin(false);
    })
  }, [])

  const login = (user) => {
    setIsLogged(true);
    setUser(user);
  }
  const logout = () => {
    logoutApi();
    setIsLogged(false);
    setUser(null)
  }
  const getUserName = () => {
    return user?.name;
  }
  const getEmail = () => {
    return user?.email;
  }
  const getUserRole = () => {
      return user?.role ? user.role : "student";
  }
  const getUser = () => {
    return user;
  }
  const getBasePath = () => {
    return getUserRole() === "student" ? "/aula" : "/profesorado";
  }

  const loggedInContextValue = {
    isLogged,
    login,
    logout,
    getUserName,
    getUserRole,
    getUser,
    getEmail,
    user,
    getBasePath,
    isCheckingLogin
  }


  return (
    <loggedInContext.Provider value={loggedInContextValue}>
      <RouterProvider router={router} />
    </loggedInContext.Provider>
  )
}

export default App
