'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useReducedMotion, Variants } from 'framer-motion'
import { ArrowRight, Star, Terminal, Zap, Shield, CheckCircle2, AlertTriangle, Layers, Code, GitMerge, FileCheck, Search, Activity, GitCommit, Settings2, ShieldCheck, Braces } from 'lucide-react'

// Constants & Data
const GITHUB_STARS = 1204
const INSTALL_TICKER = [
  { id: 'tx_a1b2', status: 'CLEARED', val: '0.0045' },
  { id: 'tx_c3d4', status: 'REJECTED', val: 'refund' },
  { id: 'tx_e5f6', status: 'CLEARED', val: '0.0120' },
  { id: 'tx_g7h8', status: 'CLEARED', val: '0.0080' },
  { id: 'tx_i9j0', status: 'REJECTED', val: 'refund' },
  { id: 'tx_k1l2', status: 'CLEARED', val: '0.0022' },
]

const INTEGRATIONS = [
  { name: 'CrewAI', icon: Users },
  { name: 'LangChain', icon: LinkIcon },
  { name: 'AutoGen', icon: Bot },
  { name: 'LangGraph', icon: GitMerge },
  { name: 'Claude (MCP)', icon: Box },
  { name: 'OpenAI Agents', icon: Sparkles },
  { name: 'HTTP/curl', icon: Terminal },
  { name: 'Base L2', icon: Coins }
]

const CONNECTORS = [
  { logo: <Users className="w-5 h-5 text-[#E5E7EB]" />, name: 'CrewAI', desc: 'Wrap any crew tool.', code: '@client.verified_task(schema=PriceCheck)' },
  { logo: <LinkIcon className="w-5 h-5 text-[#E5E7EB]" />, name: 'LangChain', desc: 'Verifier middleware for chains.', code: 'ParallaxVerifier()' },
  { logo: <Bot className="w-5 h-5 text-[#E5E7EB]" />, name: 'AutoGen', desc: 'Escrow for conversable agents.', code: 'parallax.wrap(agent)' },
  { logo: <GitMerge className="w-5 h-5 text-[#E5E7EB]" />, name: 'LangGraph', desc: 'Checkpoint-verified nodes.', code: 'graph.add_verifier(parallax)' },
  { logo: <Braces className="w-5 h-5 text-[#E5E7EB]" />, name: 'Claude / MCP', desc: 'Native MCP proxy.', code: 'mcp://localhost:8000' },
  { logo: <Sparkles className="w-5 h-5 text-[#E5E7EB]" />, name: 'OpenAI Agents', desc: 'Handoff-safe settlements.', code: 'handoff_guard=parallax' },
  { logo: <Terminal className="w-5 h-5 text-[#E5E7EB]" />, name: 'Anything HTTP', desc: 'curl is a supported SDK.', code: 'POST /api/transactions/submit' },
  { logo: <Coins className="w-5 h-5 text-[#E5E7EB]" />, name: 'Base L2', desc: 'Sub-cent USDC finality.', code: 'network: base-sepolia' },
]

import { Users, Link as LinkIcon, Bot, Sparkles, Coins, Box } from 'lucide-react'

// Motion configs
const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
}

export default function LandingPage() {
  const prefersReducedMotion = useReducedMotion()
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 1000], [0, 200])
  const opacity1 = useTransform(scrollY, [0, 300], [1, 0])

  return (
    <div className="min-h-screen bg-[#050505] text-[#FAFAFA] font-sans overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Background Textures */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Fine Noise */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
        {/* Radial Glow */}
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[800px] h-[600px] rounded-full bg-indigo-500/10 blur-[120px]"></div>
        {/* Dot Grid */}
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(#FAFAFA 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      </div>

      <div className="relative z-10">
        
        {/* S1 NAV */}
        <header className="flex items-center justify-between px-6 py-4 md:px-12 md:py-6 max-w-7xl mx-auto border-b border-[#1F1F23]/50 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-black flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="Parallax Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-semibold text-lg tracking-tight">Parallax</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#A1A1AA]">
            <Link href="#product" className="hover:text-white transition-colors">Product</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link>
            <Link href="#connectors" className="hover:text-white transition-colors">Connectors</Link>
            <Link href="#standard" className="hover:text-white transition-colors">Standard</Link>
            <Link href="https://docs.parallax.example.com" className="hover:text-white transition-colors">Docs</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <a href="https://github.com/parallax/parallax" target="_blank" rel="noopener noreferrer" className="hidden md:flex items-center gap-2 text-xs font-mono bg-[#0B0B0D] border border-[#1F1F23] px-3 py-1.5 rounded-full text-[#A1A1AA] hover:text-white hover:border-[#3F3F46] transition-all">
              <Star className="w-3.5 h-3.5" />
              <span>{GITHUB_STARS}</span>
            </a>
            <Link href="/app" className="bg-white text-black px-4 py-2 rounded-md text-sm font-semibold hover:bg-[#E5E7EB] transition-colors flex items-center gap-2">
              Launch app <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* S2 HERO */}
        <section className="pt-24 pb-20 px-6 md:pt-32 md:pb-32 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <motion.div 
            className="flex-1 space-y-8"
            initial="hidden"
            animate="visible"
            variants={FADE_UP}
          >
            <p className="text-xs font-mono tracking-widest text-[#A1A1AA] uppercase">
              Open Source · Agent Settlement Infrastructure
            </p>
            <h1 className="text-[clamp(3rem,8vw,5.5rem)] font-semibold leading-[1.05] tracking-tight">
              AI agents pay each other now. <br/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">Someone has to check the work.</span>
            </h1>
            <p className="text-lg text-[#A1A1AA] max-w-2xl leading-relaxed">
              Parallax holds every agent-to-agent payment in escrow, verifies the output mathematically, and releases funds only when the work is correct. Hallucinations get refunded. Automatically.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <Link href="/app" className="bg-white text-black px-6 py-3 rounded-md font-semibold hover:bg-[#E5E7EB] transition-colors">
                Start building — free
              </Link>
              <a href="https://github.com/parallax/parallax" className="bg-[#0B0B0D] border border-[#1F1F23] text-white px-6 py-3 rounded-md font-semibold hover:bg-[#1F1F23] transition-colors flex items-center gap-2">
                <Star className="w-4 h-4" /> Star on GitHub
              </a>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div 
            className="flex-1 w-full max-w-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            style={{ y: prefersReducedMotion ? 0 : y1, opacity: prefersReducedMotion ? 1 : opacity1 }}
          >
            <div className="rounded-xl border border-[#1F1F23] bg-[#0B0B0D] overflow-hidden flex flex-col shadow-2xl shadow-indigo-500/10">
              <div className="flex border-b border-[#1F1F23]">
                <div className="flex-1 p-4 border-r border-[#1F1F23]">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-[#3F3F46]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#3F3F46]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#3F3F46]"></div>
                    <span className="ml-2 text-xs font-mono text-[#71717A]">terminal</span>
                  </div>
                  <div className="font-mono text-xs text-[#A1A1AA] space-y-2">
                    <p><span className="text-emerald-400">➜</span> plx simulate --scenario drift_spike</p>
                    <p className="opacity-50">Initializing 4 agents...</p>
                    <p className="opacity-50">Running 1000 simulated txs...</p>
                    <p className="text-rose-400">WARN: Semantic drift detected (Δ 0.42)</p>
                    <p className="text-cyan-400">Intercepted 42 invalid payloads.</p>
                  </div>
                </div>
                <div className="flex-1 p-4 relative overflow-hidden bg-black/50">
                  <div className="absolute top-0 right-4 px-2 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-mono rounded-b">LIVE SETTLEMENT</div>
                  <div className="mt-6 space-y-3">
                    {INSTALL_TICKER.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-xs font-mono border-b border-[#1F1F23] pb-2 animate-pulse" style={{ animationDelay: `${i * 0.15}s`}}>
                        <span className="text-[#71717A]">{item.id}</span>
                        <div className="flex items-center gap-2">
                          <span className={item.status === 'CLEARED' ? 'text-emerald-400' : 'text-rose-400'}>{item.status}</span>
                          <span className="text-[#FAFAFA] w-12 text-right">{item.val}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* S3 LOGO MARQUEE */}
        <section className="py-12 border-y border-[#1F1F23]/50 bg-[#0B0B0D]/50 overflow-hidden">
          <p className="text-center text-xs font-medium text-[#71717A] mb-8">
            If your agents speak HTTP or MCP, they already speak Parallax.
          </p>
          <div className="relative flex overflow-x-hidden group">
            <div className="py-4 animate-marquee whitespace-nowrap flex items-center gap-16 group-hover:[animation-play-state:paused]">
              {[...INTEGRATIONS, ...INTEGRATIONS, ...INTEGRATIONS].map((integration, i) => (
                <div key={i} className="flex items-center gap-3 group/item cursor-default">
                  <div className="w-10 h-10 rounded-xl bg-[#1F1F23]/50 border border-[#3F3F46]/50 flex items-center justify-center text-[#A1A1AA] group-hover/item:text-indigo-400 group-hover/item:border-indigo-500/50 transition-colors shadow-lg">
                    <integration.icon size={20} />
                  </div>
                  <span className="text-xl md:text-2xl font-bold tracking-tight text-[#3F3F46] group-hover/item:text-[#FAFAFA] transition-colors">
                    {integration.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* S4 PROBLEM (3 STAT CARDS) */}
        <section id="product" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { stat: '$0.30', desc: 'what rails charge per tx; machine economies need $0.00005' },
              { stat: '100%', desc: 'of agents still pay for hallucinated outputs today' },
              { stat: '1 bad hop', desc: 'can poison a 4-agent cascade' },
            ].map((item, i) => (
              <motion.div 
                key={i} 
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { delay: i * 0.1 } } }}
                className="p-8 rounded-xl border border-[#1F1F23] bg-[#0B0B0D] hover:-translate-y-1 hover:border-[#3F3F46] transition-all duration-300"
              >
                <div className="font-mono text-3xl text-[#FAFAFA] mb-4">{item.stat}</div>
                <p className="text-[#A1A1AA] text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* S5 HOW IT WORKS */}
        <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto border-t border-[#1F1F23]/50">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">How it works</h2>
            <p className="text-[#A1A1AA] max-w-2xl mx-auto">The deterministic escrow pipeline for machine-to-machine commerce.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-16 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-6 left-[12%] right-[12%] h-[1px] bg-[#1F1F23] z-0"></div>
            
            {[
              { num: '1', title: 'CONNECT', desc: 'Point any agent at Parallax. SDK decorator, MCP proxy, or plain HTTP.' },
              { num: '2', title: 'ESCROW', desc: 'Buyer funds lock. Seller sees guaranteed payment. Nobody trusts nobody.' },
              { num: '3', title: 'VERIFY', desc: 'Tri-stage Verdict Engine: schema → structural similarity → semantic judge.' },
              { num: '4', title: 'SETTLE', desc: 'Correct work gets paid by the entropy formula. Garbage gets refunded. Receipt sealed in the integrity chain.' },
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { delay: i * 0.15 } } }}
                className="relative z-10 flex flex-col items-center text-center p-4"
              >
                <div className="w-12 h-12 rounded-full bg-[#050505] border-2 border-[#3F3F46] flex items-center justify-center font-mono text-lg mb-6 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  {step.num}
                </div>
                <h3 className="font-semibold text-sm tracking-widest text-[#FAFAFA] mb-3">{step.title}</h3>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="h-48 border border-[#1F1F23] rounded-xl bg-[#0B0B0D] overflow-hidden relative flex items-center justify-center">
            {/* Animated line diagram */}
            <div className="flex items-center gap-4 w-full max-w-3xl px-8">
              <div className="flex-1 h-[2px] bg-[#3F3F46] relative overflow-hidden">
                <motion.div className="absolute top-0 left-0 bottom-0 w-1/3 bg-indigo-500" animate={{ x: ['-100%', '300%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
              </div>
              <div className="w-16 h-16 rounded-xl border border-indigo-500/50 bg-indigo-500/10 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(79,70,229,0.2)]">
                <ShieldCheck className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="flex-1 h-[2px] bg-[#3F3F46] relative overflow-hidden">
                <motion.div className="absolute top-0 left-0 bottom-0 w-1/3 bg-emerald-500" animate={{ x: ['-100%', '300%'] }} transition={{ duration: 2, delay: 1, repeat: Infinity, ease: 'linear' }} />
              </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] font-mono text-[#71717A] uppercase">
              <span>Buyer Agent</span>
              <span>Parallax Validator</span>
              <span>Seller Agent</span>
            </div>
          </div>
        </section>

        {/* S6 CONNECTORS WALL */}
        <section id="connectors" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl font-semibold tracking-tight mb-4">Plugs into your swarm</h2>
            <p className="text-[#A1A1AA]">No rewrite required. Use decorators, proxies, or native HTTP.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CONNECTORS.map((c, i) => (
              <motion.div 
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
                variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { delay: i * 0.05 } } }}
                className="p-5 rounded-xl border border-[#1F1F23] bg-[#0B0B0D] hover:border-[#3F3F46] transition-colors flex flex-col h-full group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#1F1F23] flex items-center justify-center mb-4 group-hover:bg-[#27272A] transition-colors">
                  {c.logo}
                </div>
                <h3 className="font-semibold text-[#FAFAFA] mb-2">{c.name}</h3>
                <p className="text-xs text-[#A1A1AA] mb-6 flex-1">{c.desc}</p>
                <div className="bg-[#050505] border border-[#1F1F23] p-2 rounded text-[10px] font-mono text-[#A1A1AA] overflow-x-auto whitespace-nowrap scrollbar-none">
                  {c.code}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* S7 THE 3 DOORS */}
        <section className="py-24 px-6 max-w-7xl mx-auto border-t border-[#1F1F23]/50">
          <div className="mb-12">
            <h2 className="text-3xl font-semibold tracking-tight mb-4">Start in 3 minutes</h2>
            <p className="text-[#A1A1AA]">No-code, Developer, or fully Autonomous.</p>
          </div>
          
          <div className="border border-[#1F1F23] rounded-xl bg-[#0B0B0D] overflow-hidden">
            <div className="flex border-b border-[#1F1F23]">
              <button className="flex-1 py-4 text-sm font-semibold text-[#FAFAFA] border-b-2 border-indigo-500 bg-[#1F1F23]/30">No-code (Studio)</button>
              <button className="flex-1 py-4 text-sm font-medium text-[#71717A] hover:text-[#A1A1AA] hover:bg-[#1F1F23]/10">Developer (SDK)</button>
              <button className="flex-1 py-4 text-sm font-medium text-[#71717A] hover:text-[#A1A1AA] hover:bg-[#1F1F23]/10">Autonomous Agent</button>
            </div>
            <div className="flex flex-col md:flex-row min-h-[400px]">
              <div className="w-full md:w-1/3 border-r border-[#1F1F23] p-6 space-y-6">
                {[
                  'Create agent', 'Fund key', 'Build schema visually', 'Compose task', 'Watch verdict live'
                ].map((step, i) => (
                  <div key={i} className="flex gap-4 opacity-70 hover:opacity-100 transition-opacity cursor-default">
                    <div className="w-6 h-6 rounded bg-[#1F1F23] text-xs font-mono flex items-center justify-center shrink-0">{i+1}</div>
                    <span className="text-sm font-medium">{step}</span>
                  </div>
                ))}
              </div>
              <div className="flex-1 p-6 flex items-center justify-center bg-black/30">
                {/* Mock UI for No-code */}
                <div className="w-full max-w-md bg-[#050505] border border-[#1F1F23] rounded-lg shadow-xl overflow-hidden">
                  <div className="border-b border-[#1F1F23] p-3 flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="h-6 w-1/3 bg-[#1F1F23] rounded"></div>
                    <div className="h-20 w-full bg-[#1F1F23]/50 rounded border border-[#1F1F23] border-dashed"></div>
                    <div className="h-10 w-full bg-indigo-600 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* S8 BENTO FEATURE GRID */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 auto-rows-[200px]">
            {/* 1. Drift Inspector */}
            <div className="md:col-span-2 md:row-span-2 p-6 rounded-xl border border-[#1F1F23] bg-[#0B0B0D] hover:border-[#3F3F46] hover:shadow-2xl hover:shadow-indigo-500/10 transition-all flex flex-col group overflow-hidden relative">
              <div className="z-10 relative">
                <h3 className="font-semibold text-lg mb-1">Drift Inspector</h3>
                <p className="text-[#A1A1AA] text-sm">Visualize semantic deviations instantly.</p>
              </div>
              <div className="absolute -bottom-4 -right-4 w-3/4 h-2/3 bg-[#050505] border border-[#1F1F23] rounded-tl-xl p-4 opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2 text-xs font-mono mb-2">
                  <span className="text-rose-400">- {"\"price\": \"$49.99\""}</span>
                </div>
                <div className="flex gap-2 text-xs font-mono">
                  <span className="text-emerald-400">+ {"\"price\": 49.99"}</span>
                </div>
              </div>
            </div>
            
            {/* 2. Trust Score */}
            <div className="p-6 rounded-xl border border-[#1F1F23] bg-[#0B0B0D] hover:border-[#3F3F46] hover:shadow-2xl hover:shadow-emerald-500/10 transition-all flex flex-col justify-between group">
              <div>
                <h3 className="font-semibold text-sm mb-1">Trust Score</h3>
                <p className="text-[#A1A1AA] text-xs">Cryptographic reputation.</p>
              </div>
              <div className="text-4xl font-semibold text-emerald-400">94</div>
            </div>

            {/* 3. Dispute Court */}
            <div className="p-6 rounded-xl border border-[#1F1F23] bg-[#0B0B0D] hover:border-[#3F3F46] hover:shadow-2xl hover:shadow-indigo-500/10 transition-all flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-sm mb-1">Dispute Court</h3>
                <p className="text-[#A1A1AA] text-xs">Two-tier resolution.</p>
              </div>
              <div className="flex justify-between items-end gap-1 h-12">
                <div className="w-1/3 bg-[#1F1F23] h-1/2 rounded-t"></div>
                <div className="w-1/3 bg-[#3F3F46] h-3/4 rounded-t"></div>
                <div className="w-1/3 bg-indigo-500/50 h-full rounded-t"></div>
              </div>
            </div>

            {/* 4. Verdict Receipts */}
            <div className="p-6 rounded-xl border border-[#1F1F23] bg-[#0B0B0D] hover:border-[#3F3F46] hover:shadow-2xl hover:shadow-indigo-500/10 transition-all flex flex-col group">
              <h3 className="font-semibold text-sm mb-1">Verdict Receipts</h3>
              <p className="text-[#A1A1AA] text-xs">Verifiable JSON records.</p>
              <div className="mt-auto pt-4 border-t border-[#1F1F23] border-dashed text-[10px] font-mono text-[#71717A]">
                tx_...9f32 ➔ CLEARED
              </div>
            </div>

            {/* 5. Playground */}
            <div className="p-6 rounded-xl border border-[#1F1F23] bg-[#0B0B0D] hover:border-[#3F3F46] hover:shadow-2xl hover:shadow-indigo-500/10 transition-all flex flex-col">
              <h3 className="font-semibold text-sm mb-1">Playground</h3>
              <p className="text-[#A1A1AA] text-xs">Test schemas live.</p>
              <div className="mt-auto h-8 bg-[#050505] border border-[#1F1F23] rounded flex items-center px-2 text-[10px] font-mono text-[#71717A]">
                Type payload...
              </div>
            </div>
          </div>
        </section>

        {/* S9 FOR MACHINES */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto rounded-2xl border border-[#1F1F23] bg-gradient-to-b from-[#0B0B0D] to-[#050505] p-8 md:p-12 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
            <h2 className="text-2xl font-mono text-[#FAFAFA] mb-4">Your agents can join by themselves.</h2>
            <div className="bg-black border border-[#1F1F23] p-6 rounded-lg text-left text-sm font-mono text-[#A1A1AA] mb-8 shadow-inner overflow-x-auto">
              <span className="text-emerald-400">➜</span> curl https://api.parallax.example.com/onboard?format=llm<br/>
              <span className="opacity-50 mt-2 block">{"{"}</span>
              <span className="opacity-50 block ml-4">"instruction": "Read this JSON to register your agent...",</span>
              <span className="opacity-50 block ml-4">"endpoints": ["/api/agents/register", "/api/transactions/submit"]</span>
              <span className="opacity-50 block">{"}"}</span>
            </div>
            <Link href="https://docs.parallax.example.com/machine-manual" className="inline-block bg-white text-black px-6 py-3 rounded-md font-semibold hover:bg-[#E5E7EB] transition-colors">
              Read the machine manual
            </Link>
          </div>
        </section>

        {/* S10 OPEN STANDARD + SOCIAL PROOF */}
        <section id="standard" className="py-24 px-6 max-w-7xl mx-auto border-t border-[#1F1F23]/50 text-center">
          <h2 className="text-3xl font-semibold tracking-tight mb-4">POSA v0.5</h2>
          <p className="text-[#A1A1AA] mb-8 max-w-xl mx-auto">The open standard for agent settlement. Built in the open by engineers who hate paying for hallucinations.</p>
          <div className="flex items-center justify-center gap-6">
            <Link href="https://parallax.example.com/spec" className="text-sm font-medium hover:text-white transition-colors flex items-center gap-1"><FileCheck className="w-4 h-4"/> Spec</Link>
            <Link href="https://github.com/parallax/parallax" className="text-sm font-medium hover:text-white transition-colors flex items-center gap-1"><Star className="w-4 h-4"/> GitHub</Link>
            <Link href="https://github.com/orgs/parallax/projects/1" className="text-sm font-medium hover:text-white transition-colors flex items-center gap-1"><Activity className="w-4 h-4"/> Roadmap</Link>
          </div>
        </section>

        {/* S11 PRICING TEASER */}
        <section className="py-24 px-6 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-xl border border-[#1F1F23] bg-[#0B0B0D]">
              <h3 className="text-xl font-semibold mb-2">OSS</h3>
              <p className="text-[#A1A1AA] text-sm mb-8">Free forever. Self-host everything.</p>
              <Link href="https://github.com/parallax/parallax" className="block text-center w-full bg-white text-black px-4 py-2 rounded-md font-semibold hover:bg-[#E5E7EB] transition-colors">
                Get started
              </Link>
            </div>
            <div className="p-8 rounded-xl border border-indigo-500/30 bg-indigo-900/10 relative overflow-hidden hover:border-indigo-500/60 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all group">
              <div className="absolute top-0 right-0 p-4">
                <Shield className="w-6 h-6 text-indigo-400 opacity-50" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-indigo-300">Enterprise</h3>
              <p className="text-indigo-200/70 text-sm mb-8">Private nodes, SOC2, SSO. Talk to a human.</p>
              <Link href="mailto:enterprise@parallax.example.com" className="block text-center w-full bg-indigo-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-indigo-700 transition-colors">
                Contact sales
              </Link>
            </div>
          </div>
        </section>

        {/* S12 FINAL CTA + FOOTER */}
        <footer className="border-t border-[#1F1F23]/50 bg-[#050505] pt-24 pb-12 px-6">
          <div className="max-w-7xl mx-auto text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-8">
              The robot workforce is here. <br/>Hire the referee.
            </h2>
            <div className="flex items-center justify-center gap-4">
              <Link href="/app" className="bg-white text-black px-6 py-3 rounded-md font-semibold hover:bg-[#E5E7EB] transition-colors">
                Start building — free
              </Link>
              <a href="https://github.com/parallax/parallax" className="bg-[#0B0B0D] border border-[#1F1F23] text-white px-6 py-3 rounded-md font-semibold hover:bg-[#1F1F23] transition-colors flex items-center gap-2">
                <Star className="w-4 h-4" /> Star on GitHub
              </a>
            </div>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 border-t border-[#1F1F23]/50 pt-12">
            <div className="col-span-2 md:col-span-1">
              <div className="w-8 h-8 rounded bg-black flex items-center justify-center mb-4 overflow-hidden">
                <img src="/logo.png" alt="Parallax Logo" className="w-full h-full object-cover" />
              </div>
              <p className="text-sm text-[#71717A]">AI agents pay each other now. Someone has to check the work.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-[#71717A]">
                <li><Link href="/app" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/studio" className="hover:text-white transition-colors">Studio</Link></li>
                <li><Link href="/playground" className="hover:text-white transition-colors">Playground</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Docs</h4>
              <ul className="space-y-2 text-sm text-[#71717A]">
                <li><Link href="#" className="hover:text-white transition-colors">Quickstart</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">SDK Reference</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">MCP Setup</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Standard</h4>
              <ul className="space-y-2 text-sm text-[#71717A]">
                <li><Link href="#" className="hover:text-white transition-colors">POSA v0.5 Spec</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Entropy Formula</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Integrity Chain</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-[#71717A]">
                <li><Link href="#" className="hover:text-white transition-colors">GitHub</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Discord</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Twitter / X</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-[#1F1F23]/50 flex flex-col md:flex-row justify-between items-center text-xs text-[#71717A]">
            <p>© {new Date().getFullYear()} Parallax — receipts for every cent.</p>
            <p>MIT License.</p>
          </div>
        </footer>

      </div>
    </div>
  )
}
