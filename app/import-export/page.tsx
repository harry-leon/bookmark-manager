"use client";

import React, { useState } from "react";
import {
  FileDown,
  Upload,
  FileCode,
  CheckCircle,
  AlertTriangle,
  Folder,
  Layers,
  Link2,
  Download,
  Loader2,
} from "lucide-react";
import { TopHeader } from "@/components/layout/top-header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BookmarkImportPreview } from "@/lib/bookmarks-parser";

export default function ImportExportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [previewData, setPreviewData] = useState<{
    preview: BookmarkImportPreview;
    duplicatesCount: number;
  } | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<{
    importedPackages: number;
    importedSections: number;
    importedUrls: number;
    skippedDuplicates: number;
  } | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.endsWith(".html") && !selected.name.endsWith(".htm")) {
      toast.error("Please upload a Netscape HTML bookmark file (*.html)");
      return;
    }

    setFile(selected);
    setImportReport(null);
    setParsing(true);

    try {
      const text = await selected.text();
      const res = await fetch("/api/import-export/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ htmlContent: text }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to parse bookmark file");
      }

      const json = await res.json();
      setPreviewData(json);
      toast.success(
        `Parsed ${json.preview.totalPackages} packages and ${json.preview.totalUrls} links`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to parse file";
      toast.error(msg);
      setPreviewData(null);
    } finally {
      setParsing(false);
    }
  }

  async function handleExecuteImport() {
    if (!previewData) return;

    setImporting(true);
    try {
      const res = await fetch("/api/import-export/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packages: previewData.preview.packages,
          skipDuplicates,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to import");
      }

      const json = await res.json();
      setImportReport(json.report);
      setPreviewData(null);
      setFile(null);
      toast.success(
        `Imported ${json.report.importedUrls} links into ${json.report.importedPackages} packages!`
      );
      window.dispatchEvent(new CustomEvent("refresh-packages"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Import failed";
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <TopHeader
        breadcrumbs={[{ label: "Import & Export" }]}
        onOpenNewUrl={() => window.dispatchEvent(new CustomEvent("open-new-url"))}
        onOpenNewPackage={() => window.dispatchEvent(new CustomEvent("open-new-package"))}
        onOpenCommandPalette={() =>
          window.dispatchEvent(
            new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true })
          )
        }
      />

      <div className="flex-1 p-4 md:p-6 lg:p-8 w-full space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Section 1: Import HTML */}
          <div className="p-5 sm:p-6 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Upload className="h-4 w-4" />
              </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Import from Browser Bookmarks
              </h2>
              <p className="text-xs text-muted-foreground">
                Compatible with HTML exports from Chrome, Firefox, Safari, Edge, and Brave.
              </p>
            </div>
          </div>

          {/* Upload Area */}
          <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl p-6 transition-colors bg-muted/10 cursor-pointer">
            <input
              type="file"
              accept=".html,.htm"
              onChange={handleFileChange}
              disabled={parsing || importing}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
                {parsing ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <FileCode className="h-5 w-5" />
                )}
              </div>
              <span className="text-xs font-semibold text-foreground">
                {file ? file.name : "Click to select bookmark HTML file"}
              </span>
              <span className="text-[11px] text-muted-foreground mt-1">
                Netscape bookmark format (*.html)
              </span>
            </div>
          </div>

          {/* Import Preview Card */}
          {previewData && (
            <div className="p-4 rounded-lg border border-border bg-card/80 space-y-3 animate-in fade-in-50">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Preview detected items
              </h3>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded bg-muted/40">
                  <span className="block text-lg font-bold font-mono">
                    {previewData.preview.totalPackages}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Packages</span>
                </div>
                <div className="p-2 rounded bg-muted/40">
                  <span className="block text-lg font-bold font-mono">
                    {previewData.preview.totalSections}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Sections</span>
                </div>
                <div className="p-2 rounded bg-muted/40">
                  <span className="block text-lg font-bold font-mono">
                    {previewData.preview.totalUrls}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Total Links</span>
                </div>
              </div>

              {previewData.duplicatesCount > 0 && (
                <div className="flex items-start gap-2 p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>{previewData.duplicatesCount} duplicate links</strong> detected
                    that already exist in your library.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="accent-primary"
                  />
                  <span>Skip duplicate URLs</span>
                </label>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPreviewData(null);
                      setFile(null);
                    }}
                    disabled={importing}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleExecuteImport}
                    disabled={importing}
                    className="h-8 text-xs shadow-xs"
                  >
                    {importing ? "Importing..." : "Confirm & Import"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Success Report */}
          {importReport && (
            <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 space-y-1 text-xs text-foreground animate-in fade-in-50">
              <span className="font-bold text-emerald-500 flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                Import Completed Successfully!
              </span>
              <ul className="list-disc pl-5 pt-1 space-y-0.5 text-muted-foreground">
                <li>Created {importReport.importedPackages} new packages</li>
                <li>Created {importReport.importedSections} new sections</li>
                <li>Imported {importReport.importedUrls} URLs</li>
                <li>Skipped {importReport.skippedDuplicates} duplicates</li>
              </ul>
            </div>
          )}
        </div>

        {/* Section 2: Export Data */}
        <div className="p-5 rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Export Data</h2>
              <p className="text-xs text-muted-foreground">
                Download your bookmarks in browser-compatible HTML or raw JSON.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* HTML Export Card */}
            <div className="p-4 rounded-lg border border-border/60 bg-muted/20 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-foreground">
                  Browser HTML Bookmarks
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  Standard Netscape Bookmark format. Import directly into Chrome, Edge, Safari, Firefox.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("/api/import-export/export?format=html", "_blank")}
                className="mt-3 h-8 text-xs gap-1.5 w-full"
              >
                <Download className="h-3.5 w-3.5" />
                Export as HTML
              </Button>
            </div>

            {/* JSON Export Card */}
            <div className="p-4 rounded-lg border border-border/60 bg-muted/20 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-foreground">
                  Full JSON Backup
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  Complete structured export of all Packages, Sections, URLs, and Tags for migration or programmatic use.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("/api/import-export/export?format=json", "_blank")}
                className="mt-3 h-8 text-xs gap-1.5 w-full"
              >
                <Download className="h-3.5 w-3.5" />
                Export as JSON
              </Button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
