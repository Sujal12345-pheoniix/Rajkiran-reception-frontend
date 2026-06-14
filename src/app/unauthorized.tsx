import Link from "next/link";

export default function Unauthorized(){
  return (
    <main className="flex items-center justify-center min-h-screen">
      <div className="flex items-center flex-col gap-4">
        <h1 className="text-red-500 border border-red-300 text-3xl p-5 rounded-lg shadow-md">Unauthorize access</h1>
        <Link href={"/auth"} className="px-5 py-2 rounded-lg border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all">Login page</Link>
      </div>
    </main>
  )
}