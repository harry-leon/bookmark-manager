"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Layers,
  ArrowRight,
  Sparkles,
  Search,
  ShieldCheck,
  FileDown,
  CheckCircle2,
  Folder,
  ExternalLink,
  Lock,
  Zap,
  Globe,
  Tag,
  Wrench,
  Cloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GithubIcon } from "@/components/shared/github-icon";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

export function LandingView() {
  const [activeTab, setActiveTab] = useState<"backend" | "frontend" | "devops">("backend");
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-foreground">
      {/* 1. Glassmorphism Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Logo size="sm" badge="v1.0" href="/" />

          {/* Center Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Tính năng
            </a>
            <a href="#hierarchy" className="hover:text-foreground transition-colors">
              Mô hình 3 tầng
            </a>
            <a href="#security" className="hover:text-foreground transition-colors">
              Bảo mật OWASP
            </a>
            <a href="#demo" className="hover:text-foreground transition-colors">
              Tài khoản Demo
            </a>
          </nav>

          {/* Right: GitHub Profile + Auth CTAs */}
          <div className="flex items-center gap-2">
            {/* User GitHub Profile Link */}
            <a
              href="https://github.com/harry-leon"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 px-2.5 rounded-md border border-border/70 bg-card hover:bg-muted text-foreground transition-colors text-xs font-medium shadow-xs"
              title="GitHub Profile: harry-leon"
              aria-label="GitHub Profile: harry-leon"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">harry-leon</span>
            </a>

            <Link href="/login">
              <Button variant="ghost" size="sm" className="h-8 text-xs font-medium">
                Đăng nhập
              </Button>
            </Link>

            <Link href="/login">
              <Button size="sm" className="h-8 text-xs font-medium gap-1 shadow-xs">
                <span>Dùng thử</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-border/40">
        {/* Ambient Backlight Glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[360px] bg-gradient-to-b from-indigo-500/20 via-primary/10 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/70 bg-card/60 backdrop-blur-xs text-xs font-medium text-muted-foreground mb-6 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Developer-First URL & Bookmark Manager</span>
            <span className="text-border">•</span>
            <span className="text-foreground font-semibold">Tối giản & Siêu nhẹ</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.15]">
            Tổ chức bookmark & URL <br className="hidden sm:inline" />
            theo từng <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 bg-clip-text text-transparent">Package & Section</span>
          </h1>

          {/* Description */}
          <p className="mt-5 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Lấy cảm hứng từ sự tinh gọn của <strong>Linear</strong> & <strong>Raycast</strong>,
            kết hợp kiến trúc phân cấp của <strong>CtrlTAB</strong> và sức mạnh bookmark của <strong>Linkwarden</strong>.
            Quản lý tài liệu lập trình, GitHub repos, API docs và dev tools tốc độ 60 FPS.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-11 px-6 text-sm font-semibold gap-2 shadow-md">
                <span>Trải nghiệm ngay (Live Demo)</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <a
              href="https://github.com/harry-leon"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-11 px-5 text-sm font-medium gap-2 border-border/80">
                <GithubIcon className="h-4 w-4" />
                <span>GitHub Profile: harry-leon</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </Button>
            </a>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Không quảng cáo
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Chống SSRF & Rate Limit
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Import/Export Netscape HTML
            </span>
          </div>
        </div>

        {/* 3. Interactive UI Mockup Preview */}
        <div id="hierarchy" className="max-w-5xl mx-auto mt-12 px-4 sm:px-6 relative z-10">
          <div className="rounded-xl border border-border/80 bg-card/70 backdrop-blur-xl shadow-2xl overflow-hidden glow-card">
            {/* Mock Window Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/40 gap-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="h-3.5 w-px bg-border/60 mx-1 hidden sm:block" />
                <div className="flex items-center gap-1 bg-muted/70 p-0.5 rounded-md border border-border/60 text-[11px]">
                  <button
                    onClick={() => setActiveTab("backend")}
                    className={cn(
                      "px-2 py-0.5 rounded-sm transition-all font-medium",
                      activeTab === "backend"
                        ? "bg-card text-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Java Backend
                  </button>
                  <button
                    onClick={() => setActiveTab("frontend")}
                    className={cn(
                      "px-2 py-0.5 rounded-sm transition-all font-medium",
                      activeTab === "frontend"
                        ? "bg-card text-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Developer Tools & UI
                  </button>
                  <button
                    onClick={() => setActiveTab("devops")}
                    className={cn(
                      "px-2 py-0.5 rounded-sm transition-all font-medium",
                      activeTab === "devops"
                        ? "bg-card text-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Cloud & DevOps
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/40">
                  ⌘K Quick Search
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/40 hidden md:inline">
                  ⌘N New URL
                </span>
              </div>
            </div>

            {/* Mock Content */}
            <div className="p-5 sm:p-6 space-y-6">
              {activeTab === "backend" && (
                <>
                  <div className="flex items-center justify-between pb-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20">
                        <Folder className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">Java Backend Ecosystem</h3>
                        <p className="text-xs text-muted-foreground">Enterprise Spring Boot, Security, Databases and Tools</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      3 Sections • 6 URLs
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Section: Spring Boot
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-mono text-muted-foreground">
                        2 links
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-lg border border-border/60 bg-card hover:border-border transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-4 w-4 rounded bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-500">
                            S
                          </div>
                          <h4 className="text-xs font-semibold text-foreground truncate">Spring Boot Documentation</h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                          Comprehensive guides and reference docs for Spring Boot.
                        </p>
                        <div className="mt-2.5 flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground font-mono">
                            #backend
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground font-mono">
                            #framework
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-lg border border-border/60 bg-card hover:border-border transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-4 w-4 rounded bg-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-500">
                            ⚡
                          </div>
                          <h4 className="text-xs font-semibold text-foreground truncate">Spring Initializr</h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                          Bootstrap your Spring Boot application with dependencies.
                        </p>
                        <div className="mt-2.5 flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground font-mono">
                            #framework
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Section: Security & Auth
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-mono text-muted-foreground">
                        2 links
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-lg border border-border/60 bg-card hover:border-border transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-4 w-4 rounded bg-rose-500/20 flex items-center justify-center text-[10px] font-bold text-rose-500">
                            🛡️
                          </div>
                          <h4 className="text-xs font-semibold text-foreground truncate">JWT.io Token Debugger</h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                          Decode, verify and generate JSON Web Tokens.
                        </p>
                        <div className="mt-2.5 flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground font-mono">
                            #jwt
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground font-mono">
                            #security
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-lg border border-border/60 bg-card hover:border-border transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-4 w-4 rounded bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-500">
                            🐘
                          </div>
                          <h4 className="text-xs font-semibold text-foreground truncate">PostgreSQL 16 Manual</h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                          Official PostgreSQL relational database documentation.
                        </p>
                        <div className="mt-2.5 flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground font-mono">
                            #database
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "frontend" && (
                <>
                  <div className="flex items-center justify-between pb-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 font-bold border border-indigo-500/20">
                        <Wrench className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">Developer Tools & UI</h3>
                        <p className="text-xs text-muted-foreground">Modern productivity toolset, design systems, and frontend components</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      1 Section • 3 URLs
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Section: UI Components
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-mono text-muted-foreground">
                        2 links
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-lg border border-border/60 bg-card hover:border-border transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-4 w-4 rounded bg-cyan-500/20 flex items-center justify-center text-[10px] font-bold text-cyan-500">
                            🎨
                          </div>
                          <h4 className="text-xs font-semibold text-foreground truncate">Tailwind CSS Documentation</h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                          A utility-first CSS framework for rapid UI development.
                        </p>
                        <div className="mt-2.5 flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground font-mono">
                            #frontend
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground font-mono">
                            #css
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-lg border border-border/60 bg-card hover:border-border transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-4 w-4 rounded bg-slate-500/20 flex items-center justify-center text-[10px] font-bold text-slate-300">
                            ▲
                          </div>
                          <h4 className="text-xs font-semibold text-foreground truncate">shadcn/ui</h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                          Beautifully designed components that you can copy and paste into your apps.
                        </p>
                        <div className="mt-2.5 flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground font-mono">
                            #ui
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground font-mono">
                            #react
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "devops" && (
                <>
                  <div className="flex items-center justify-between pb-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                        <Cloud className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">Cloud & DevOps Infrastructure</h3>
                        <p className="text-xs text-muted-foreground">Containers, CI/CD pipelines, Docker, Kubernetes and Monitoring</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      2 Sections • 4 URLs
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Section: Containers & Orchestration
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-mono text-muted-foreground">
                        2 links
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-lg border border-border/60 bg-card hover:border-border transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-4 w-4 rounded bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-500">
                            🐳
                          </div>
                          <h4 className="text-xs font-semibold text-foreground truncate">Docker Hub Official Registry</h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                          Find and share container images with your team.
                        </p>
                        <div className="mt-2.5 flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground font-mono">
                            #devops
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground font-mono">
                            #docker
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-lg border border-border/60 bg-card hover:border-border transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-4 w-4 rounded bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-500">
                            ☸️
                          </div>
                          <h4 className="text-xs font-semibold text-foreground truncate">Kubernetes Documentation</h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                          Production-grade container orchestration system.
                        </p>
                        <div className="mt-2.5 flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground font-mono">
                            #k8s
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features Grid */}
      <section id="features" className="py-16 md:py-24 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Được thiết kế cho kỹ sư & người làm việc hiệu suất cao
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              Tất cả các tính năng đều tập trung vào tốc độ, sự an toàn và trải nghiệm không rườm rà.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs hover:border-border transition-all">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Cấu trúc phân cấp 3 tầng</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Tổ chức theo mô hình <strong>Package → Sections → URLs</strong>. Bạn có thể lưu URL trực tiếp tại Package hoặc chia nhỏ vào các Section chuyên biệt.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs hover:border-border transition-all">
              <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Command Palette ⌘K</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Tìm kiếm tức thì toàn bộ URL, Package, Section và Tags bằng bàn phím. Không cần chuột, chuyển trang tức thời với độ trễ gần như bằng 0.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs hover:border-border transition-all">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Phát hiện trùng lặp tự động</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Tự động chuẩn hóa đường dẫn, kiểm tra scheme http/https và cảnh báo ngay lập tức nếu URL đã tồn tại trong bất kỳ Package nào trước đó.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs hover:border-border transition-all">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                <FileDown className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Import & Export đa định dạng</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Nhập xuất bookmark chuẩn Netscape Bookmark HTML tương thích 100% với Chrome, Firefox, Edge, Safari và sao lưu dữ liệu toàn diện qua JSON.
              </p>
            </div>

            {/* Feature 5 */}
            <div id="security" className="p-6 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs hover:border-border transition-all">
              <div className="h-9 w-9 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Bảo mật chuẩn OWASP & Chống SSRF</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Lọc dải IP riêng tư và Cloud Metadata khi cào tiêu đề/favicon. Sliding-window rate limit và cô lập dữ liệu người dùng tuyệt đối (Anti-IDOR).
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs hover:border-border transition-all">
              <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Tối ưu LCP & 60 FPS</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Code splitting qua dynamic modal imports, React.memo cho URL cards, font swap không giật layout và First Load JS chỉ 87.6 kB.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Demo Account Callout */}
      <section id="demo" className="py-16 md:py-20 border-b border-border/40 bg-muted/20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-sm mb-4">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Trải nghiệm ngay với Tài khoản Demo
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            Dữ liệu mẫu (Java Backend, UI Components, Spring Boot, PostgreSQL) đã được nạp sẵn.
          </p>

          <div className="mt-6 p-4 rounded-xl border border-border/80 bg-card inline-block text-left shadow-sm">
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-20">Email:</span>
                <span className="text-foreground font-semibold">demo@linkstack.app</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-20">Password:</span>
                <span className="text-foreground font-semibold">Password123!</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Link href="/login">
              <Button size="lg" className="h-10 px-6 text-xs font-semibold gap-2 shadow-sm">
                <span>Vào trang Đăng nhập</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="py-8 bg-background border-t border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Logo size="xs" showText={false} href={null} />
            <span>© 2026 LinkStack. Open source bookmark manager.</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/harry-leon"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors font-medium"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              <span>Created by harry-leon</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
