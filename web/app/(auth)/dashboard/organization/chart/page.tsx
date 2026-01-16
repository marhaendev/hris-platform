"use client";

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/(auth)/DashboardClientLayout';
import {
    ReactFlow,
    Controls,
    Background,
    BackgroundVariant,
    useNodesState,
    useEdgesState,
    addEdge,
    MiniMap,
    ConnectionLineType,
    Node,
    Edge,
    Panel,
    useReactFlow,
    Position,
    Handle,
    NodeProps,
    ReactFlowInstance,
    getNodesBounds,
    getViewportForBounds
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, RefreshCw, Eye, EyeOff, Plus, Trash2, Briefcase, Building2, Building, Eraser, Users, User, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { ConfirmDialog } from "@/components/confirm-dialog";

// --- Custom Node for Company ---
const CompanyNode = ({ data }: NodeProps) => {
    return (
        <div className="group" style={{
            background: '#16a34a', // green-600
            color: '#ffffff',
            border: '2px solid #16a34a',
            borderRadius: '8px',
            padding: '8px 12px',
            width: 260,
            fontWeight: 'bold',
            textAlign: 'left',
            fontSize: '14px',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            minHeight: '60px'
        }}>
            {/* No Input Handle for Root */}

            <div className="flex items-center gap-2 overflow-hidden flex-1">
                <div className="p-1.5 bg-white/20 rounded shrink-0">
                    <Building size={16} className="text-white" />
                </div>
                <div className="uppercase truncate" title={data.label as string}>{data.label as string}</div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
                <div className="text-[10px] bg-white/20 border border-white/10 px-2 py-0.5 rounded text-white font-medium cursor-default" title={`${data.count} Departemen`}>
                    {data.count as number} Dept
                </div>
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        data.onAddDepartment && (data.onAddDepartment as () => void)();
                    }}
                    className="cursor-pointer bg-white/20 p-1 rounded text-white hover:bg-white hover:text-green-700 transition-all border border-transparent shadow-sm"
                    title="Tambah Departemen Baru"
                >
                    <Plus size={14} />
                </div>
            </div>

            <Handle type="source" position={Position.Right} style={{ background: '#16a34a', width: '8px', height: '8px', border: '2px solid #ffffff' }} />
        </div>
    );
};

// --- Custom Node for Department ---
const DepartmentNode = ({ data }: NodeProps) => {
    return (
        <div className="group" style={{
            background: '#f0fdf4', // green-50
            border: '2px solid #16a34a', // green-600
            borderRadius: '8px',
            padding: '8px 12px',
            width: 260,
            color: '#0f172a',
            fontWeight: 'bold',
            textAlign: 'left',
            fontSize: '12px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            minHeight: '46px'
        }}>
            <Handle type="target" position={Position.Left} style={{ background: '#16a34a', width: '8px', height: '8px' }} />

            <div className="flex items-center gap-2 overflow-hidden flex-1">
                <div className="p-1 bg-green-100 text-green-700 rounded shrink-0">
                    <Building2 size={12} />
                </div>
                <div className="uppercase truncate" title={data.label as string}>{data.label as string}</div>
            </div>

            <div className='flex items-center gap-1 shrink-0'>
                <div className="text-[10px] bg-white border border-green-200 px-1.5 py-0.5 rounded text-green-700 font-medium cursor-default" title={`${data.count} Posisi`}>
                    {data.count as number}
                </div>
                {Boolean(data.hasChildren) && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            data.onToggle && (data.onToggle as () => void)();
                        }}
                        className="cursor-pointer bg-white p-1 rounded text-slate-500 hover:text-green-600 transition-all border border-transparent hover:border-green-300 hover:bg-green-50"
                        title={data.isExpanded ? "Sembunyikan Posisi" : "Tampilkan Posisi"}
                    >
                        {data.isExpanded ? <Eye size={12} /> : <EyeOff size={12} />}
                    </div>
                )}
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        data.onAddPosition && (data.onAddPosition as () => void)();
                    }}
                    className="cursor-pointer bg-white p-1 rounded text-slate-500 hover:text-green-600 transition-all border border-transparent hover:border-green-300 hover:bg-green-50"
                    title="Tambah Posisi Baru"
                >
                    <Plus size={12} />
                </div>
                {(data.emptyPositionsCount as number) > 0 && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            data.onCleanup && (data.onCleanup as () => void)();
                        }}
                        className="cursor-pointer bg-white p-1 rounded text-slate-500 hover:text-amber-600 transition-all border border-transparent hover:border-amber-300 hover:bg-amber-50"
                        title={`Hapus ${data.emptyPositionsCount} Posisi Kosong`}
                    >
                        <Eraser size={12} />
                    </div>
                )}
                {(data.count === 0) && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            data.onDelete && (data.onDelete as () => void)();
                        }}
                        className="cursor-pointer bg-white p-1 rounded text-slate-500 hover:text-red-600 transition-all border border-transparent hover:border-red-300 hover:bg-red-50"
                        title="Hapus Departemen Kosong"
                    >
                        <Trash2 size={12} />
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Right} style={{ background: '#16a34a', width: '8px', height: '8px' }} />
        </div>
    );
};

// --- Custom Node for Position ---
// --- Custom Node for Position ---
const PositionNode = ({ data }: NodeProps) => {
    return (
        <div style={{
            background: data.isEmployeesVisible ? '#eff6ff' : '#ffffff',
            border: data.isEmployeesVisible ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '8px 12px',
            width: 260, // Match Dept Width
            fontSize: '12px',
            textAlign: 'center',
            color: '#334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '40px',
            gap: '8px',
            boxShadow: data.isEmployeesVisible ? '0 4px 6px -1px rgb(59 130 246 / 0.2)' : 'none'
        }}>
            <Handle type="target" position={Position.Left} style={{ background: '#cbd5e1', width: '6px', height: '6px' }} />

            <div className="flex items-center gap-2 overflow-hidden flex-1">
                <div className={`p-1 rounded shrink-0 ${data.isEmployeesVisible ? 'bg-blue-100 text-blue-700' : 'bg-blue-50 text-blue-600'}`}>
                    <Briefcase size={12} />
                </div>
                <div className="truncate text-left flex-1 font-medium" title={data.label as string}>
                    {data.label as string}
                </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
                {/* Employee Count Badge */}
                {(data.employeeCount as number) > 0 && (
                    <div className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full text-slate-500 font-medium" title={`${data.employeeCount} Karyawan`}>
                        {data.employeeCount as number}
                    </div>
                )}

                {/* Toggle Employees Button */}
                {(data.employeeCount as number) > 0 && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            data.onToggleEmployees && (data.onToggleEmployees as () => void)();
                        }}
                        className={`cursor-pointer p-1 rounded transition-colors border ${data.isEmployeesVisible ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 border-transparent'}`}
                        title={data.isEmployeesVisible ? "Sembunyikan Karyawan" : "Tampilkan Karyawan"}
                    >
                        {data.isLoading ? (
                            <Loader2 size={12} className="animate-spin text-blue-600" />
                        ) : data.isEmployeesVisible ? (
                            <Users size={12} />
                        ) : (
                            <Users size={12} />
                        )}
                    </div>
                )}


                {/* Delete Button - Only if empty */}
                {(data.employeeCount === 0) && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            data.onDelete && (data.onDelete as () => void)();
                        }}
                        className="cursor-pointer p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Hapus Posisi Kosong"
                    >
                        <Trash2 size={12} />
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Right} style={{ background: '#cbd5e1', width: '6px', height: '6px', opacity: data.isEmployeesVisible ? 1 : 0 }} />
        </div>
    );
};

// --- Custom Node for Employee ---
const EmployeeNode = ({ data }: NodeProps) => {
    return (
        <div style={{
            background: '#ffffff',
            border: '1px solid #e0e7ff', // Light indigo border
            borderLeft: '3px solid #6366f1', // Indigo accent
            borderRadius: '8px',
            padding: '10px 14px',
            width: 240,
            fontSize: '11px',
            color: '#334155',
            minHeight: '50px',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
        }}>
            <Handle type="target" position={Position.Left} style={{ background: '#818cf8', width: '6px', height: '6px' }} />

            {/* Name */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <div className="p-1 bg-indigo-50 text-indigo-600 rounded-full shrink-0">
                    <User size={12} />
                </div>
                <div style={{
                    fontWeight: '600',
                    fontSize: '11px',
                    color: '#1e293b',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                }} title={data.name as string}>
                    {data.name as string}
                </div>
            </div>

            {/* Email */}
            <div style={{
                fontSize: '10px',
                color: '#64748b',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                paddingLeft: '28px'
            }} title={data.email as string}>
                📧 {data.email as string}
            </div>
        </div>
    );
};

const nodeTypes = {
    company: CompanyNode,
    department: DepartmentNode,
    position: PositionNode,
    employee: EmployeeNode
};
const nodeWidth = 260; // Wider width for single line

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({
        rankdir: direction,
        ranksep: 50, // Horizontal distance (tighter)
        nodesep: 15  // Vertical distance (tighter)
    });

    nodes.forEach((node) => {
        // Uniform height for streamlined look
        dagreGraph.setNode(node.id, { width: nodeWidth, height: 50 });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        const newNode: Node = {
            ...node,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - 50 / 2,
            },
        };
        return newNode;
    });

    return { nodes: layoutedNodes, edges };
};

export default function OrgChartPage() {
    // Node Types Definition
    const nodeTypes = useMemo(() => ({
        company: CompanyNode,
        department: DepartmentNode,
        position: PositionNode,
        employee: EmployeeNode  // CRITICAL: Register employee node type!
    }), []);

    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
    const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);

    // Raw Data State
    const [rawDepts, setRawDepts] = useState<any[]>([]);
    const [rawPositions, setRawPositions] = useState<any[]>([]);
    const [companyInfo, setCompanyInfo] = useState<any>(null);
    const [collapsedDeptIds, setCollapsedDeptIds] = useState<Set<number>>(new Set());

    const [isLoading, setIsLoading] = useState(true);

    // Add Position State
    const [isAddPosOpen, setIsAddPosOpen] = useState(false);
    const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
    const [newPosTitle, setNewPosTitle] = useState('');
    const [newPosLevel, setNewPosLevel] = useState('Staff');
    const [isSavingPos, setIsSavingPos] = useState(false);

    // Add Dept State
    const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');
    const [isSavingDept, setIsSavingDept] = useState(false);


    // Delete State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteType, setDeleteType] = useState<'department' | 'position' | 'cleanup' | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [deleteTargetName, setDeleteTargetName] = useState<string>('');

    // Employee Visualization State
    const [expandedPosId, setExpandedPosId] = useState<number | null>(null);
    const [positionEmployees, setPositionEmployees] = useState<Record<number, any[]>>({});
    const [loadingPosId, setLoadingPosId] = useState<number | null>(null);

    const handleTogglePositionEmployees = useCallback(async (posId: number) => {
        if (expandedPosId === posId) {
            setExpandedPosId(null);
            return;
        }

        if (positionEmployees[posId]) {
            setExpandedPosId(posId);
            setTimeout(() => setPendingFocusId(`pos-${posId}`), 50);
            return;
        }

        setLoadingPosId(posId);
        try {
            const res = await fetch(`/api/organization/chart-employees?positionId=${posId}`);
            if (res.ok) {
                const data = await res.json();
                console.log('🔍 API Response for posId', posId, ':', data);
                console.log('🔍 Data length:', data.length);

                // Visual feedback
                if (data.length > 0) {
                    toast.success(`✅ ${data.length} karyawan dimuat`);
                } else {
                    toast.warning(`⚠️ Tidak ada karyawan di posisi ini`);
                }

                setPositionEmployees(prev => ({
                    ...prev,
                    [posId]: data
                }));
                setExpandedPosId(posId);
                setTimeout(() => setPendingFocusId(`pos-${posId}`), 50);
            } else {
                toast.error('Gagal memuat API');
            }
        } catch (error) {
            console.error("Failed to load chart employees:", error);
            toast.error("Gagal memuat data karyawan");
        } finally {
            setLoadingPosId(null);
        }
    }, [expandedPosId, positionEmployees]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [deptRes, posRes, companyRes] = await Promise.all([
                fetch('/api/departments?all=true'),
                fetch('/api/positions?all=true'),
                fetch('/api/organization/company')
            ]);

            if (!deptRes.ok || !posRes.ok) throw new Error("Failed to fetch data");

            const departments = await deptRes.json();
            setRawDepts(departments);

            const positions = await posRes.json();
            setRawPositions(positions);

            const companyData = companyRes.ok ? await companyRes.json() : null;
            setCompanyInfo(companyData);

        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat data organisasi");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleExpandAll = () => {
        setCollapsedDeptIds(new Set());
        setPendingFocusId('ALL');
    };
    const handleCollapseAll = () => {
        setCollapsedDeptIds(new Set(rawDepts.map(d => d.id)));
        setPendingFocusId('ALL');
    };

    // Toggle Handler
    const toggleDept = useCallback((deptId: number) => {
        setCollapsedDeptIds(prev => {
            const next = new Set(prev);
            if (next.has(deptId)) {
                next.delete(deptId);
            } else {
                next.add(deptId);
            }
            return next;
        });
    }, []);

    // Add Position Handlers
    const handleOpenAddPosition = useCallback((deptId: number) => {
        setSelectedDeptId(deptId);
        setNewPosTitle('');
        setNewPosLevel('Staff');
        setIsAddPosOpen(true);
    }, []);

    const handleSavePosition = async () => {
        if (!selectedDeptId || !newPosTitle) return;
        setIsSavingPos(true);
        try {
            const res = await fetch('/api/positions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newPosTitle,
                    level: newPosLevel,
                    departmentId: selectedDeptId
                })
            });

            if (res.ok) {
                const newPos = await res.json();
                toast.success('Posisi berhasil ditambahkan');
                setIsAddPosOpen(false);

                // Ensure dept is expanded so focus can work
                setCollapsedDeptIds(prev => {
                    const next = new Set(prev);
                    next.delete(selectedDeptId);
                    return next;
                });

                setPendingFocusId(`pos-${newPos.id}`);
                loadData();
            } else {
                toast.error('Gagal menambahkan posisi');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        } finally {
            setIsSavingPos(false);
        }
    };

    // Add Department Handlers
    const handleSaveDepartment = async () => {
        if (!newDeptName) return;
        setIsSavingDept(true);
        try {
            const res = await fetch('/api/departments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newDeptName
                })
            });

            if (res.ok) {
                const newDept = await res.json();
                toast.success('Departemen berhasil ditambahkan');
                setIsAddDeptOpen(false);
                setNewDeptName('');

                setPendingFocusId(`dept-${newDept.id}`);
                loadData();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Gagal menambahkan departemen');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        } finally {
            setIsSavingDept(false);
        }
    };


    // Delete Handlers
    const handleDeleteClick = useCallback((type: 'department' | 'position' | 'cleanup', id: number, name: string) => {
        setDeleteType(type);
        setDeleteTargetId(id);
        setDeleteTargetName(name);
        setDeleteConfirmOpen(true);
    }, []);

    const confirmDelete = async () => {
        if (!deleteTargetId || !deleteType) return;

        setIsLoading(true);
        try {
            let res;
            if (deleteType === 'cleanup') {
                res = await fetch(`/api/positions?departmentId=${deleteTargetId}&onlyEmpty=true`, {
                    method: 'DELETE'
                });
            } else {
                const endpoint = deleteType === 'department' ? '/api/departments' : '/api/positions';
                res = await fetch(`${endpoint}?id=${deleteTargetId}`, {
                    method: 'DELETE'
                });
            }

            if (res.ok) {
                const data = await res.json();
                if (deleteType === 'cleanup') {
                    toast.success(`${data.deletedCount} posisi kosong berhasil dibersihkan`);
                } else {
                    toast.success(`${deleteType === 'department' ? 'Departemen' : 'Posisi'} berhasil dihapus`);
                }
                loadData();
            } else {
                const data = await res.json();
                toast.error(data.error || `Gagal ${deleteType === 'cleanup' ? 'membersihkan' : 'menghapus'}`);
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat menghapus');
        } finally {
            setIsLoading(false);
            setDeleteConfirmOpen(false);
            setDeleteTargetId(null);
        }
    };

    // Export PNG Handler
    const handleExportPNG = useCallback(() => {
        if (!rfInstance) {
            toast.error('Chart belum siap untuk di-export');
            return;
        }

        // Export all current nodes (including expanded employees if any)
        // This is useful for sharing org chart with team details
        const exportNodes = [...nodes];
        const exportEdges = [...edges];

        console.log('🔍 [Export] Total nodes to export:', exportNodes.length);
        console.log('🔍 [Export] Total edges to export:', exportEdges.length);

        // Wait for render then export
        setTimeout(() => {
            // Calculate bounds for all nodes
            const nodesBounds = getNodesBounds(exportNodes);
            const imageWidth = nodesBounds.width + 200; // Add padding
            const imageHeight = nodesBounds.height + 200;

            // Calculate viewport to fit these bounds
            const viewport = getViewportForBounds(
                nodesBounds,
                imageWidth,
                imageHeight,
                0.5, // min zoom
                2,   // max zoom
                0.1  // padding
            );

            console.log('🔍 [Export] Nodes bounds:', nodesBounds);
            console.log('🔍 [Export] Image size:', { width: imageWidth, height: imageHeight });
            console.log('🔍 [Export] Viewport:', viewport);

            // Wait for fitView to complete
            setTimeout(() => {
                // Get the react flow viewport element
                const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;

                console.log('🔍 [Export] Viewport element:', viewportElement);

                if (!viewportElement) {
                    toast.error('Gagal mengambil chart viewport');
                    return;
                }

                // Use html-to-image to capture with calculated dimensions
                import('html-to-image').then(({ toPng }) => {
                    // Create a virtual canvas with proper dimensions
                    const originalViewport = rfInstance.getViewport();

                    // Set transform for export
                    rfInstance.setViewport({
                        x: -nodesBounds.x + 100,
                        y: -nodesBounds.y + 100,
                        zoom: 1
                    });

                    setTimeout(() => {
                        const rfWrapper = document.querySelector('.react-flow__renderer') as HTMLElement;

                        toPng(rfWrapper || viewportElement, {
                            backgroundColor: '#ffffff',
                            width: imageWidth,
                            height: imageHeight,
                            pixelRatio: 2,
                            style: {
                                width: `${imageWidth}px`,
                                height: `${imageHeight}px`,
                            }
                        })
                            .then((dataUrl: string) => {
                                // Generate filename with timestamp for uniqueness
                                const now = new Date();
                                const timestamp = now.toISOString().replace(/[:\.]/g, '-').slice(0, -5); // YYYY-MM-DDTHH-MM-SS
                                const filename = `organization-chart-${timestamp}.png`;

                                const link = document.createElement('a');
                                link.download = filename;
                                link.href = dataUrl;
                                link.click();
                                toast.success('Chart berhasil di-export!');
                            })
                            .catch((error: Error) => {
                                console.error('Export error:', error);
                                toast.error('Gagal export chart');
                            })
                            .finally(() => {
                                // Restore original viewport
                                rfInstance.setViewport(originalViewport);
                            });
                    }, 50);
                }).catch((error: Error) => {
                    console.error('Failed to load html-to-image:', error);
                    toast.error('Library export tidak tersedia');
                });
            }, 150); // Wait for fitView
        }, 100);
    }, [rfInstance, nodes, edges, setNodes, setEdges]);


    // Auto Focus Effect
    useEffect(() => {
        if (pendingFocusId && rfInstance && nodes.length > 0) {
            if (pendingFocusId === 'ALL') {
                // Fit all nodes (Global view)
                setTimeout(() => {
                    rfInstance.fitView({
                        padding: 0.2,
                        maxZoom: 1,
                        duration: 1000
                    });
                    setPendingFocusId(null);
                }, 100);
            } else {
                // Focus specific node (or subtree)
                const node = nodes.find(n => n.id === pendingFocusId);

                if (node) {
                    setTimeout(() => {
                        let nodesToFit = [{ id: pendingFocusId }];

                        // If it's a department, include its positions in the view
                        if (pendingFocusId.startsWith('dept-')) {
                            const childEdges = edges.filter(e => e.source === pendingFocusId);
                            const childNodes = childEdges.map(e => ({ id: e.target }));
                            nodesToFit = [...nodesToFit, ...childNodes];
                        }

                        rfInstance.fitView({
                            nodes: nodesToFit,
                            padding: 0.2, // Slightly more padding to show context
                            maxZoom: 1.2,
                            duration: 1000
                        });
                        setPendingFocusId(null);
                    }, 100);
                }
            }
        }
    }, [pendingFocusId, rfInstance, nodes, edges]);


    // Build Graph Effect
    useEffect(() => {
        if (isLoading) return;

        const companyName = Array.isArray(companyInfo) ? companyInfo[0]?.name : (companyInfo?.name || 'Perusahaan');

        let newNodes: Node[] = [];
        let newEdges: Edge[] = [];

        // 0. Root Node: Company
        const companyNodeId = 'root-company';
        newNodes.push({
            id: companyNodeId,
            type: 'company', // Use custom type
            data: {
                label: companyName,
                count: rawDepts.length,
                onAddDepartment: () => setIsAddDeptOpen(true)
            },
            position: { x: 0, y: 0 },
        });

        // 1. Departments
        rawDepts.forEach((dept: any) => {
            const deptId = `dept-${dept.id}`;
            const isExpanded = !collapsedDeptIds.has(dept.id);
            const deptPositions = rawPositions.filter((p: any) => p.departmentId === dept.id);
            const hasChildren = deptPositions.length > 0;
            const emptyPositionsCount = deptPositions.filter((p: any) => !p.employeeCount || p.employeeCount === 0).length;

            newNodes.push({
                id: deptId,
                type: 'department', // Custom node
                data: {
                    label: dept.name,
                    isExpanded,
                    hasChildren,
                    count: deptPositions.length,
                    emptyPositionsCount,
                    onToggle: () => toggleDept(dept.id),
                    onAddPosition: () => handleOpenAddPosition(dept.id),
                    onDelete: () => handleDeleteClick('department', dept.id, dept.name),
                    onCleanup: () => handleDeleteClick('cleanup', dept.id, dept.name)
                },
                position: { x: 0, y: 0 },
            });

            // Edge: Company -> Dept
            newEdges.push({
                id: `e-root-${deptId}`,
                source: companyNodeId,
                target: deptId,
                type: 'smoothstep',
                style: { stroke: '#94a3b8', strokeWidth: 2 },
            });

            // 2. Positions (Only if expanded)
            if (isExpanded) {
                deptPositions.forEach((pos: any) => {
                    const posId = `pos-${pos.id}`;
                    const isEmployeesVisible = expandedPosId === pos.id;

                    newNodes.push({
                        id: posId,
                        type: 'position', // Custom Position Node
                        data: {
                            label: pos.title,
                            employeeCount: pos.employeeCount || 0,
                            isEmployeesVisible,
                            isLoading: loadingPosId === pos.id,
                            onDelete: () => handleDeleteClick('position', pos.id, pos.title),
                            onToggleEmployees: () => handleTogglePositionEmployees(pos.id)
                        },
                        position: { x: 0, y: 0 },
                        // Style handled in Custom Node now, but layout needs dimensions
                    });

                    newEdges.push({
                        id: `e-${dept.id}-${pos.id}`,
                        source: deptId,
                        target: posId,
                        type: 'smoothstep',
                        animated: true,
                        style: { stroke: '#cbd5e1', strokeWidth: 1.5 },
                    });

                    // 3. Employees (Only if position expanded)
                    const emps = positionEmployees[pos.id];

                    if (isEmployeesVisible && emps && Array.isArray(emps)) {
                        emps.forEach((emp: any) => {
                            const empId = `emp-${emp.id}`;
                            newNodes.push({
                                id: empId,
                                type: 'employee',
                                data: {
                                    name: emp.name,
                                    email: emp.email,
                                    title: emp.title
                                },
                                position: { x: 0, y: 0 }
                            });

                            newEdges.push({
                                id: `e-${pos.id}-${emp.id}`,
                                source: posId,
                                target: empId,
                                type: 'smoothstep',
                                animated: true,
                                style: { stroke: '#6366f1', strokeWidth: 1.5 }
                            });
                        });
                    }
                });
            }
        });

        // Compute Layout
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges, 'LR');
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);

    }, [
        rawDepts,
        rawPositions,
        companyInfo,
        collapsedDeptIds,
        toggleDept,
        handleOpenAddPosition,
        handleDeleteClick,
        setNodes,
        setEdges,
        isLoading,
        expandedPosId,
        positionEmployees,
        handleTogglePositionEmployees,
        loadingPosId
    ]);


    useEffect(() => {
        loadData();
    }, [loadData]);

    return (
        <div className="h-full w-full flex flex-col p-4 space-y-4">
            <Card className="flex-1 flex flex-col overflow-hidden border-0 shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Bagan Organisasi</CardTitle>
                            <CardDescription>Visualisasi struktur departemen dan jabatan.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={collapsedDeptIds.size === 0 ? handleCollapseAll : handleExpandAll}
                                title={collapsedDeptIds.size === 0 ? "Sembunyikan Semua" : "Tampilkan Semua"}
                            >
                                {collapsedDeptIds.size === 0 ? (
                                    <><EyeOff className="h-4 w-4 mr-2" /> Hide All</>
                                ) : (
                                    <><Eye className="h-4 w-4 mr-2" /> Show All</>
                                )}
                            </Button>
                            <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleExportPNG} disabled={!rfInstance}>
                                <Download className="h-4 w-4 mr-2" /> Export PNG
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 relative border rounded-lg bg-white overflow-hidden" style={{ minHeight: '600px' }}>
                    {isLoading && nodes.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                    ) : (
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            nodeTypes={nodeTypes}
                            onInit={setRfInstance}
                            fitView
                            attributionPosition="bottom-right"
                        >
                            <Controls />
                            <MiniMap />
                            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />

                            <Panel position="top-right" className="bg-white p-2 rounded shadow-sm border text-xs text-slate-500">
                                {nodes.length} Node(s)
                            </Panel>
                        </ReactFlow>
                    )}
                </CardContent>
            </Card>

            {/* Add Position Dialog */}
            <Dialog open={isAddPosOpen} onOpenChange={setIsAddPosOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Posisi Baru</DialogTitle>
                        <DialogDescription>
                            Menambahkan posisi/jabatan baru di departemen ini.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Nama Posisi</Label>
                            <Input
                                id="title"
                                value={newPosTitle}
                                onChange={(e) => setNewPosTitle(e.target.value)}
                                placeholder="Contoh: Digital Marketing Specialist"
                                autoFocus
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="level" className="text-sm font-medium">Level</Label>
                            <select
                                id="level"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={newPosLevel}
                                onChange={(e) => setNewPosLevel(e.target.value)}
                            >
                                <option value="Intern">Intern</option>
                                <option value="Staff">Staff</option>
                                <option value="Senior Staff">Senior Staff</option>
                                <option value="Supervisor">Supervisor</option>
                                <option value="Manager">Manager</option>
                                <option value="Director">Director</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddPosOpen(false)}>Batal</Button>
                        <Button onClick={handleSavePosition} disabled={isSavingPos || !newPosTitle}>
                            {isSavingPos && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Posisi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Department Dialog */}
            <Dialog open={isAddDeptOpen} onOpenChange={setIsAddDeptOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Departemen Baru</DialogTitle>
                        <DialogDescription>
                            Buat departemen baru untuk organisasi ini.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="deptName">Nama Departemen</Label>
                            <Input
                                id="deptName"
                                value={newDeptName}
                                onChange={(e) => setNewDeptName(e.target.value)}
                                placeholder="Contoh: Finance & Accounting"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDeptOpen(false)}>Batal</Button>
                        <Button onClick={handleSaveDepartment} disabled={isSavingDept || !newDeptName}>
                            {isSavingDept && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Departemen
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title={deleteType === 'cleanup' ? 'Bersihkan Posisi Kosong?' : `Hapus ${deleteType === 'department' ? 'Departemen' : 'Posisi'}?`}
                description={
                    deleteType === 'cleanup'
                        ? `Anda yakin ingin menghapus semua posisi yang tidak memiliki karyawan di departemen "${deleteTargetName}"? Tindakan ini tidak dapat dibatalkan.`
                        : `Anda yakin ingin menghapus ${deleteType === 'department' ? 'departemen' : 'posisi'} "${deleteTargetName}"? Tindakan ini tidak dapat dibatalkan.`
                }
                confirmText={deleteType === 'cleanup' ? "Ya, Bersihkan" : "Ya, Hapus"}
                variant="danger"
                onConfirm={confirmDelete}
            />
        </div>
    );
}
