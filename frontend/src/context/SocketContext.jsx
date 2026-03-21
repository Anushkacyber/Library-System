import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setConnected(false)
      }
      return
    }

    const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    })

    s.on('connect', () => {
      setConnected(true)
      s.emit('join', { userId: user.id, role: user.role })
    })

    s.on('disconnect', () => setConnected(false))

    s.on('notification', ({ type, message }) => {
      if (type === 'warning') toast.error(message, { icon: '⚠️' })
      else toast.success(message)
    })

    setSocket(s)
    return () => {
      s.disconnect()
    }
  }, [user?.id])

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
