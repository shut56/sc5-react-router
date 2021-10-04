import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Head from './head'

const Home = () => {
  const [user, setUser] = useState('')

  return (
    <div>
      <Head title="Dashboard" />
      <div className="flex flex-row justify-center w-full p-4">
        <div className="flex flex-col justify-center items-center w-1/2 bg-yellow-300 border rounded-md font-bold p-4">
          Enter your name:
          <input type="text" onChange={(e) => setUser(e.target.value)} value={user} />
          <Link
            className="p-2 m-2 bg-indigo-400 rounded-md font-semibold text-white"
            type="button"
            to={`/${user}`}
          >
            Go to...
          </Link>
        </div>
      </div>
    </div>
  )
}

Home.propTypes = {}

export default Home
