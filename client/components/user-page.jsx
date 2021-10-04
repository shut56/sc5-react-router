import React from 'react'
import { useParams } from 'react-router-dom'
import Head from './head'

const UserPage = () => {
  const { user } = useParams()
  return (
    <div>
      <Head title="User Page" />
      <div className="flex flex-row justify-center w-full p-4">
        <div className="flex justify-center items-center w-1/2 h-12 bg-yellow-300 border rounded-md font-bold">
          Hello {user}!
        </div>
      </div>
    </div>
  )
}

UserPage.propTypes = {}

export default React.memo(UserPage)
