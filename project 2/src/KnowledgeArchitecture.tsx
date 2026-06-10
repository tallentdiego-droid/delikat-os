import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircleIcon,
  BarChart3Icon,
  BookOpenCheckIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  FileTextIcon,
  RefreshCwIcon,
  TargetIcon,
  XIcon,
} from 'lucide-react';
import { fetchDelikatDocuments } from './api';
import { DelikatDoc, SopPrefill } from './types';

type RequiredSOP = {
  title: string;
  category: string;
  description: string;
};

type PositionCoverage = {
  name: string;
  department: string;
  required: RequiredSOP[];
  matches: SOPMatch[];
  missing: RequiredSOP[];
  coverage: number;
};

type SOPMatch = {
  required: RequiredSOP;
  doc: DelikatDoc;
  confidence: number;
};

const STOP_WORDS = new Set([
  'and',
  'the',
  'for',
  'with',
  'when',
  'from',
  'into',
  'during',
  'procedure',
  'process',
  'standard',
  'sop',
  'delikat',
]);

const POSITION_REQUIREMENTS: { name: string; department: string; required: RequiredSOP[] }[] = [
  {
    name: 'General Manager',
    department: 'Management',
    required: [
      {
        title: 'Daily Management Opening Review',
        category: 'Operations',
        description: 'Defines the daily checks a General Manager completes before service, including staffing, reservations, cleanliness, cash readiness, and operational risks.',
      },
      {
        title: 'Daily Management Closing Review',
        category: 'Operations',
        description: 'Explains how management closes the restaurant, verifies sales, reviews incidents, confirms cleaning, and prepares the next shift.',
      },
      {
        title: 'Weekly Operations Review',
        category: 'Operations',
        description: 'Covers the weekly review of sales, labor, food cost, guest feedback, maintenance issues, and open operational follow-ups.',
      },
      {
        title: 'Incident Log Management',
        category: 'Operations',
        description: 'Defines how managers document incidents, assign follow-up, escalate serious issues, and keep a reliable operational record.',
      },
      {
        title: 'Manager Communication With Ownership',
        category: 'Operations',
        description: 'Sets expectations for how managers communicate urgent issues, weekly summaries, approvals, and operational risks to ownership.',
      },
    ],
  },
  {
    name: 'Restaurant Manager',
    department: 'Management',
    required: [
      {
        title: 'Shift Handover Between Managers',
        category: 'Operations',
        description: 'Explains how one manager transfers service status, staffing issues, guest concerns, cash notes, and pending tasks to the next manager.',
      },
      {
        title: 'Customer Complaint Escalation',
        category: 'Service',
        description: 'Defines how managers receive, document, resolve, and escalate guest complaints during restaurant service.',
      },
      {
        title: 'Staff No-Show Response',
        category: 'HR',
        description: 'Covers what the manager does when an employee misses a shift, including coverage, documentation, and communication.',
      },
      {
        title: 'Cash Register Discrepancy Review',
        category: 'Finance',
        description: 'Explains how managers investigate cash drawer differences, document findings, and decide next actions.',
      },
      {
        title: 'Supplier Delivery Rejection',
        category: 'Suppliers',
        description: 'Defines when and how a manager rejects a supplier delivery because of quality, temperature, quantity, or documentation issues.',
      },
    ],
  },
  {
    name: 'Supervisor',
    department: 'Management',
    required: [
      {
        title: 'Supervisor Shift Checklist',
        category: 'Operations',
        description: 'Lists the key checks supervisors complete during opening, active service, and closing support.',
      },
      {
        title: 'Service Floor Monitoring',
        category: 'Service',
        description: 'Explains how supervisors monitor tables, service timing, staff readiness, cleanliness, and guest experience.',
      },
      {
        title: 'Break Scheduling During Service',
        category: 'HR',
        description: 'Defines how supervisors schedule breaks while maintaining coverage and service quality.',
      },
      {
        title: 'Minor Guest Issue Resolution',
        category: 'Service',
        description: 'Covers how supervisors resolve minor guest concerns before they need manager escalation.',
      },
      {
        title: 'End of Shift Supervisor Report',
        category: 'Operations',
        description: 'Defines the report supervisors leave for management after each shift, including incidents, staffing, and pending work.',
      },
    ],
  },
  {
    name: 'Cashier',
    department: 'Cashier / POS',
    required: [
      {
        title: 'Cashier Opening Procedure',
        category: 'Finance',
        description: 'Explains how the cashier prepares the register, POS, receipt printer, card terminal, cash drawer, and workspace before service.',
      },
      {
        title: 'Cashier Closing Procedure',
        category: 'Finance',
        description: 'Covers end-of-day cashier responsibilities, including drawer count, sales packet, receipts, and handoff to management.',
      },
      {
        title: 'Cash Drawer Count',
        category: 'Finance',
        description: 'Defines how cashiers count the drawer, verify starting cash, record differences, and report discrepancies.',
      },
      {
        title: 'Refund and Void Procedure',
        category: 'Finance',
        description: 'Explains when refunds or voids are allowed, who approves them, and how they are documented in the POS.',
      },
      {
        title: 'POS System Failure Manual Billing',
        category: 'Operations',
        description: 'Defines how cashiers continue taking payments and documenting sales when the POS system is unavailable.',
      },
    ],
  },
  {
    name: 'Waiter',
    department: 'Front of House',
    required: [
      {
        title: 'Guest Greeting Standard',
        category: 'Service',
        description: 'Defines the expected greeting, timing, tone, and first interaction waiters should provide to every table.',
      },
      {
        title: 'Order Taking Standard',
        category: 'Service',
        description: 'Explains how waiters take accurate orders, confirm details, ask modifiers, and communicate special requests.',
      },
      {
        title: 'Allergy Handling Procedure',
        category: 'Service',
        description: 'Covers how waiters identify allergies, communicate them to the kitchen, confirm safe options, and avoid unsafe promises.',
      },
      {
        title: 'Table Maintenance During Service',
        category: 'Service',
        description: 'Defines table checkbacks, clearing, drink refills, cleanliness, and guest attention during the meal.',
      },
      {
        title: 'Guest Farewell Standard',
        category: 'Service',
        description: 'Explains how waiters close the guest experience, thank guests, confirm satisfaction, and invite them back.',
      },
    ],
  },
  {
    name: 'Hostess',
    department: 'Front of House',
    required: [
      {
        title: 'Hostess Opening Procedure',
        category: 'Service',
        description: 'Covers host stand setup, reservation review, menus, waiting list tools, and floor readiness before service.',
      },
      {
        title: 'Guest Seating Procedure',
        category: 'Service',
        description: 'Explains greeting, party size confirmation, table assignment, pacing, and escorting guests to tables.',
      },
      {
        title: 'Waitlist Management',
        category: 'Service',
        description: 'Defines how the hostess quotes wait times, records guest names, updates parties, and communicates table availability.',
      },
      {
        title: 'Reservation Handling',
        category: 'Service',
        description: 'Explains how reservations are confirmed, adjusted, seated, and escalated when the floor is full.',
      },
      {
        title: 'Host Stand Closing Procedure',
        category: 'Service',
        description: 'Covers end-of-shift cleanup, reservation notes, lost items, menus, and handoff to management.',
      },
    ],
  },
  {
    name: 'Kitchen',
    department: 'Kitchen',
    required: [
      {
        title: 'Kitchen Opening Prep Procedure',
        category: 'Kitchen',
        description: 'Defines how the kitchen prepares stations, checks mise en place, verifies equipment, and confirms production needs before service.',
      },
      {
        title: 'Line Cook Station Setup',
        category: 'Kitchen',
        description: 'Explains station readiness, ingredient placement, tools, sanitation, labels, and timing expectations for line cooks.',
      },
      {
        title: 'Food Safety Temperature Checks',
        category: 'Kitchen',
        description: 'Covers required temperature checks for storage, cooking, holding, cooling, and corrective action.',
      },
      {
        title: 'Kitchen Closing Cleaning Procedure',
        category: 'Kitchen',
        description: 'Defines kitchen closing cleaning, equipment shutdown, labeling, waste removal, and manager verification.',
      },
      {
        title: 'Product Out of Stock Handling',
        category: 'Kitchen',
        description: 'Explains how kitchen staff report outages, substitute items, communicate with service, and prevent unavailable menu sales.',
      },
    ],
  },
  {
    name: 'Bar / Café',
    department: 'Bar / Café',
    required: [
      {
        title: 'Bar Opening Procedure',
        category: 'Bar',
        description: 'Covers bar setup, glassware, garnishes, ice, beverage stock, equipment checks, and cleanliness before service.',
      },
      {
        title: 'Coffee Station Opening Procedure',
        category: 'Bar',
        description: 'Explains how to prepare the coffee station, espresso machine, milk, syrups, cups, and cleaning supplies.',
      },
      {
        title: 'Alcohol Service Standard',
        category: 'Bar',
        description: 'Defines responsible alcohol service, ID checks, refusal of service, and escalation to management.',
      },
      {
        title: 'Beverage Recipe Standard',
        category: 'Bar',
        description: 'Covers how bartenders and baristas follow approved recipes, measurements, presentation, and quality checks.',
      },
      {
        title: 'Bar Closing Procedure',
        category: 'Bar',
        description: 'Defines end-of-shift bar cleaning, stock storage, cash/payment handoff, equipment shutdown, and waste removal.',
      },
    ],
  },
  {
    name: 'Purchasing',
    department: 'Inventory & Purchasing',
    required: [
      {
        title: 'Inventory Count Procedure',
        category: 'Suppliers',
        description: 'Explains how inventory is counted, recorded, verified, and prepared for purchasing decisions.',
      },
      {
        title: 'Supplier Order Placement',
        category: 'Suppliers',
        description: 'Defines how purchasing prepares orders, checks par levels, confirms prices, and submits supplier requests.',
      },
      {
        title: 'Delivery Receiving Procedure',
        category: 'Suppliers',
        description: 'Covers receiving deliveries, checking temperature, quantity, quality, invoices, and storage.',
      },
      {
        title: 'Invoice Matching Procedure',
        category: 'Finance',
        description: 'Explains how received products are matched against invoices, order records, and supplier discrepancies.',
      },
      {
        title: 'Low Stock Escalation',
        category: 'Suppliers',
        description: 'Defines how purchasing communicates low stock risks and urgent substitute needs to management and kitchen.',
      },
    ],
  },
  {
    name: 'Maintenance',
    department: 'Cleaning & Maintenance',
    required: [
      {
        title: 'Daily Maintenance Walkthrough',
        category: 'Operations',
        description: 'Defines the daily inspection of equipment, lights, restrooms, dining areas, kitchen areas, and safety issues.',
      },
      {
        title: 'Cleaning Schedule Verification',
        category: 'Operations',
        description: 'Explains how maintenance verifies completed cleaning tasks, documents missed work, and reports recurring issues.',
      },
      {
        title: 'Equipment Issue Reporting',
        category: 'Operations',
        description: 'Covers how equipment problems are reported, prioritized, documented, and escalated for repair.',
      },
      {
        title: 'Restroom Cleaning Standard',
        category: 'Operations',
        description: 'Defines restroom cleaning frequency, supplies, inspection standards, and guest-ready requirements.',
      },
      {
        title: 'Water Leak or Flooding Response',
        category: 'Operations',
        description: 'Explains immediate actions for leaks or flooding, guest safety, equipment protection, cleanup, and manager escalation.',
      },
    ],
  },
];

const coverageClass = (coverage: number) => {
  if (coverage >= 80) return 'text-emerald-400';
  if (coverage >= 50) return 'text-yellow-400';
  return 'text-red-400';
};

const coverageBarClass = (coverage: number) => {
  if (coverage >= 80) return 'bg-emerald-500';
  if (coverage >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function meaningfulTokens(value: string): string[] {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function getDocumentSearchText(doc: DelikatDoc): string {
  return [
    doc.metadata.title ?? '',
    doc.metadata.source_path ?? '',
    doc.content.slice(0, 1000),
  ].join(' ');
}

function scoreMatch(required: RequiredSOP, doc: DelikatDoc): number {
  const requiredTokens = meaningfulTokens(required.title);
  if (requiredTokens.length === 0) return 0;

  const docText = normalizeText(getDocumentSearchText(doc));
  const requiredText = normalizeText(required.title);
  if (docText.includes(requiredText)) return 100;

  const docTokens = new Set(meaningfulTokens(getDocumentSearchText(doc)));
  const overlap = requiredTokens.filter((token) => docTokens.has(token)).length;
  const ratio = overlap / requiredTokens.length;
  return Math.round(ratio * 100);
}

function findBestMatch(required: RequiredSOP, docs: DelikatDoc[]): SOPMatch | null {
  let best: SOPMatch | null = null;

  docs.forEach((doc) => {
    const confidence = scoreMatch(required, doc);
    if (!best || confidence > best.confidence) {
      best = { required, doc, confidence };
    }
  });

  if (!best) return null;
  const tokenCount = meaningfulTokens(required.title).length;
  const threshold = tokenCount <= 3 ? 67 : 55;
  return best.confidence >= threshold ? best : null;
}

function buildCoverage(docs: DelikatDoc[]): PositionCoverage[] {
  return POSITION_REQUIREMENTS.map((position) => {
    const matches = position.required
      .map((required) => findBestMatch(required, docs))
      .filter((match): match is SOPMatch => Boolean(match));
    const matchedTitles = new Set(matches.map((match) => match.required.title));
    const missing = position.required.filter((required) => !matchedTitles.has(required.title));
    const coverage = Math.round((matches.length / position.required.length) * 100);

    return {
      ...position,
      matches,
      missing,
      coverage,
    };
  });
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-stone-800/40 border border-stone-700/40 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-wider text-stone-500">{label}</p>
        <span className="text-stone-500">{icon}</span>
      </div>
      <p className="text-2xl font-semibold text-stone-100 mt-2">{value}</p>
    </div>
  );
}

function PositionDrawer({
  position,
  onClose,
  onCreateSOPDraft,
}: {
  position: PositionCoverage;
  onClose: () => void;
  onCreateSOPDraft: (prefill: SopPrefill) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-2xl h-full bg-stone-900 border-l border-stone-700/60 flex flex-col shadow-2xl">
        <div className="flex items-start justify-between px-5 py-4 border-b border-stone-800/70 flex-shrink-0">
          <div>
            <p className="text-[10px] text-amber-500 uppercase tracking-wider mb-1">{position.department}</p>
            <h2 className="text-base font-semibold text-stone-100">{position.name}</h2>
            <p className="text-xs text-stone-500 mt-1">
              {position.matches.length} existing of {position.required.length} required SOPs
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded text-stone-500 hover:text-stone-300 hover:bg-stone-800 transition-colors">
            <XIcon size={16} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-stone-800/50 flex-shrink-0">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-stone-500">Coverage</span>
            <span className={`font-semibold ${coverageClass(position.coverage)}`}>{position.coverage}%</span>
          </div>
          <div className="h-2 rounded-full bg-stone-800 overflow-hidden">
            <div className={`h-full ${coverageBarClass(position.coverage)}`} style={{ width: `${position.coverage}%` }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircleIcon size={15} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-stone-200">Existing SOPs Matched</h3>
            </div>

            {position.matches.length === 0 ? (
              <p className="text-sm text-stone-600">No required SOPs matched existing documents yet.</p>
            ) : (
              <div className="space-y-2">
                {position.matches.map((match) => (
                  <div key={match.required.title} className="rounded-lg border border-stone-700/40 bg-stone-800/30 p-3">
                    <p className="text-sm font-medium text-stone-200">{match.required.title}</p>
                    <p className="text-xs text-stone-500 mt-1">
                      Matched: {match.doc.metadata.title ?? 'Untitled'} · {match.confidence}% confidence
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <TargetIcon size={15} className="text-red-400" />
              <h3 className="text-sm font-semibold text-stone-200">Missing SOPs</h3>
            </div>

            {position.missing.length === 0 ? (
              <p className="text-sm text-stone-600">This position has full first-pass SOP coverage.</p>
            ) : (
              <div className="space-y-2">
                {position.missing.map((sop) => (
                  <div key={sop.title} className="rounded-lg border border-stone-700/40 bg-stone-800/30 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-stone-200">{sop.title}</p>
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] border border-stone-600/50 text-stone-400">
                            {sop.category}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 leading-relaxed">{sop.description}</p>
                      </div>
                      <button
                        onClick={() => onCreateSOPDraft({ title: sop.title, category: sop.category, description: sop.description })}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/15 hover:bg-amber-600/25 border border-amber-600/30 text-amber-400 text-xs font-medium transition-all whitespace-nowrap"
                      >
                        Generate Draft
                        <ChevronRightIcon size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

interface KnowledgeArchitectureProps {
  onCreateSOPDraft: (prefill: SopPrefill) => void;
}

export default function KnowledgeArchitecture({ onCreateSOPDraft }: KnowledgeArchitectureProps) {
  const [docs, setDocs] = useState<DelikatDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<PositionCoverage | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDelikatDocuments();
      setDocs(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load Knowledge Architecture.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const coverage = useMemo(() => buildCoverage(docs), [docs]);
  const requiredCount = coverage.reduce((sum, position) => sum + position.required.length, 0);
  const missingCount = coverage.reduce((sum, position) => sum + position.missing.length, 0);
  const averageCoverage = coverage.length
    ? Math.round(coverage.reduce((sum, position) => sum + position.coverage, 0) / coverage.length)
    : 0;

  return (
    <div className="flex flex-col h-full bg-stone-900">
      <header className="flex items-center gap-2.5 px-6 py-4 border-b border-stone-800/70 bg-stone-900/90 backdrop-blur-sm flex-shrink-0">
        <BarChart3Icon size={17} className="text-amber-500" />
        <div>
          <h1 className="text-sm font-semibold text-stone-200 leading-none">Knowledge Architecture</h1>
          <p className="text-[10px] text-stone-600 mt-0.5 uppercase tracking-wider">Role-based SOP coverage</p>
        </div>
        <button onClick={load} className="ml-auto p-1.5 rounded-lg text-stone-500 hover:text-stone-300 hover:bg-stone-800 transition-colors" title="Refresh">
          <RefreshCwIcon size={14} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <span className="w-6 h-6 border-2 border-stone-700 border-t-amber-500 rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-900/20 border border-red-700/40 rounded-lg">
            <AlertCircleIcon size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <MetricCard label="Documents Loaded" value={docs.length} icon={<FileTextIcon size={15} />} />
              <MetricCard label="Required SOPs" value={requiredCount} icon={<BookOpenCheckIcon size={15} />} />
              <MetricCard label="Missing SOPs" value={missingCount} icon={<TargetIcon size={15} />} />
              <MetricCard label="Average Coverage" value={`${averageCoverage}%`} icon={<BarChart3Icon size={15} />} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {coverage.map((position) => (
                <button
                  key={position.name}
                  onClick={() => setSelectedPosition(position)}
                  className="text-left rounded-xl bg-stone-800/40 border border-stone-700/40 hover:border-stone-600/70 hover:bg-stone-800/70 transition-all p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-stone-100">{position.name}</h2>
                      <p className="text-xs text-stone-500 mt-0.5">{position.department}</p>
                    </div>
                    <span className={`text-lg font-semibold ${coverageClass(position.coverage)}`}>
                      {position.coverage}%
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-stone-900/80 overflow-hidden mb-3">
                    <div className={`h-full ${coverageBarClass(position.coverage)}`} style={{ width: `${position.coverage}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500">
                      {position.matches.length} / {position.required.length} existing
                    </span>
                    <span className={position.missing.length > 0 ? 'text-red-400' : 'text-emerald-400'}>
                      {position.missing.length} missing
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedPosition && (
        <PositionDrawer
          position={selectedPosition}
          onClose={() => setSelectedPosition(null)}
          onCreateSOPDraft={onCreateSOPDraft}
        />
      )}
    </div>
  );
}
