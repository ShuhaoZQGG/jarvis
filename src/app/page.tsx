import Link from 'next/link'
import { ArrowRight, MessageSquare, Zap, Shield, Globe } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="bg-gradient-to-b from-primary-50 to-white">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
              Your AI Chatbot in{' '}
              <span className="text-primary-600">Seconds</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Transform your website into an intelligent assistant. Just enter your URL, 
              and Jarvis creates a custom chatbot trained on your content.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                Get Started Free <ArrowRight className="ml-2" size={20} />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg border-2 border-primary-600 hover:bg-primary-50 transition-colors"
              >
                Live Demo
              </Link>
            </div>
          </div>
        </div>
      </div>

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="text-primary-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Enter Your URL</h3>
              <p className="text-gray-600">
                Provide your website URL and we'll automatically scan and index your content.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="text-primary-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Train AI Model</h3>
              <p className="text-gray-600">
                Our AI learns from your content to provide accurate, contextual responses.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="text-primary-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Embed & Chat</h3>
              <p className="text-gray-600">
                Add one line of code to your site and start chatting with visitors instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
            Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Shield className="text-primary-600 mb-4" size={32} />
              <h3 className="text-xl font-semibold mb-2">Enterprise Security</h3>
              <p className="text-gray-600">
                Your data is encrypted and secure. GDPR compliant and SOC 2 certified.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <Zap className="text-primary-600 mb-4" size={32} />
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-600">
                Powered by GPT-4 and vector search for instant, accurate responses.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <MessageSquare className="text-primary-600 mb-4" size={32} />
              <h3 className="text-xl font-semibold mb-2">Customizable Widget</h3>
              <p className="text-gray-600">
                Match your brand with custom colors, position, and greeting messages.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Website?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of websites using Jarvis to engage visitors
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-8 py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors text-lg"
          >
            Start Free Trial <ArrowRight className="ml-2" size={24} />
          </Link>
        </div>
      </section>
    </main>
  )
}