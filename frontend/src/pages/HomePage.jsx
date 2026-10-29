import { motion } from 'framer-motion'

function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6 selection:bg-neutral-800">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex flex-col items-center gap-3 text-center"
      >
        <h1 className="text-3xl font-medium tracking-tight">Hello World</h1>
      </motion.div>
    </main>
  )
}

export default HomePage
