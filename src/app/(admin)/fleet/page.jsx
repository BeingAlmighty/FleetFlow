"use client";
import { useState, useEffect, useMemo } from "react";
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender, 
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel
} from "@tanstack/react-table";
import { Search, Filter, MoreHorizontal, FileDown, Loader2, ArrowUpDown, Upload } from "lucide-react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { downloadCSV } from "@/utils/csv";
const columns = [
  {
    accessorKey: "number_plate",
    header: "Number Plate",
    cell: ({ row }) => <div className="font-medium">{row.getValue("number_plate")}</div>,
  },
  {
    accessorKey: "model",
    header: "Model",
  },
  {
    accessorKey: "area",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 hover:bg-transparent"
        >
          Area
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("area") || "Unassigned"}</div>,
  },
  {
    accessorKey: "last_driver_name",
    header: "Last Driver",
    cell: ({ row }) => {
      const val = row.getValue("last_driver_name");
      return val ? val : <span className="text-muted-foreground italic">None</span>;
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status");
      return (
        <Badge variant="outline" className={
          status === 'Available' ? 'border-success/50 text-success bg-success/10' : 
          status === 'Alloted' ? 'border-muted-foreground/50 text-muted-foreground bg-muted/50' :
          'border-warning/50 text-warning bg-warning/10'
        }>
          {status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          } />
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>View details</DropdownMenuItem>
              <DropdownMenuItem>View trip history</DropdownMenuItem>
              <DropdownMenuItem>Schedule maintenance</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
];
import { createClient } from "@/utils/supabase/client";
export default function FleetPage() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sorting, setSorting] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [HubManagers, setHubManagers] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualForm, setManualForm] = useState({ number_plate: "", model: "", hubmanager_id: "" });
  const supabase = createClient();
  useEffect(() => {
    async function fetchVehicles() {
      const [
        { data: vehicles },
        { data: drivers },
        { data: profiles }
      ] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('drivers').select('*'),
        supabase.from('profiles').select('id, full_name, area').in('role', ['hubmanager', 'GUARD'])
      ]);
      if (profiles) setHubManagers(profiles);
      const drvMap = {};
      if (drivers) {
        drivers.forEach(d => drvMap[d.id] = d.name);
      }
      if (vehicles) {
        const enhanced = vehicles.map(v => ({
          ...v,
          last_driver_name: v.last_driver_id ? (drvMap[v.last_driver_id] || v.last_driver_id) : null
        }));
        setData(enhanced);
      }
      setLoading(false);
    }
    fetchVehicles();
  }, []);
  const handleManualAdd = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const vId = `V-${Math.floor(100 + Math.random() * 900)}`;
    const hm = HubManagers.find(g => g.id === manualForm.hubmanager_id);
    const payload = { 
      ...manualForm, 
      id: vId,
      area: hm ? hm.area : null
    };
    const { error } = await supabase.from('vehicles').insert([payload]);
    setIsSubmitting(false);
    if (!error) {
      setIsAddOpen(false);
      setManualForm({ number_plate: "", model: "", hubmanager_id: "" });
      window.location.reload(); 
    } else {
      alert("Error adding vehicle: " + error.message);
    }
  };
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsSubmitting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const { data } = results;
        const validData = data.filter(d => d.number_plate && d.model && d.hubmanager_id).map(d => {
          const hm = HubManagers.find(g => g.id === d.hubmanager_id);
          return {
            ...d,
            id: `V-${Math.floor(100 + Math.random() * 900)}`,
            area: hm ? hm.area : null
          };
        });
        if (validData.length > 0) {
          const { error } = await supabase.from('vehicles').insert(validData);
          if (error) {
            alert("Error importing CSV: " + error.message);
          } else {
            setIsAddOpen(false);
            window.location.reload();
          }
        } else {
          alert("No valid rows found. Ensure columns match the template (number_plate, model, hubmanager_id).");
        }
        setIsSubmitting(false);
      },
      error: (error) => {
        alert("Error parsing CSV: " + error.message);
        setIsSubmitting(false);
      }
    });
  };
  const filteredData = useMemo(() => {
    return data.filter(v => (areaFilter === "All" || v.area === areaFilter) && (statusFilter === "all" || String(v.status || "").toLowerCase() === statusFilter.toLowerCase()));
  }, [data, areaFilter, statusFilter]);
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
  });
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Fleet Management</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor all your e-rickshaws.</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="shrink-0 gap-2" />}>
            Add Vehicle
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
              <DialogDescription>
                Manually add a vehicle or upload a CSV file.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="manual" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="csv">Import CSV</TabsTrigger>
              </TabsList>
              <TabsContent value="manual" className="space-y-4 pt-4">
                <form onSubmit={handleManualAdd} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="v_num">Number Plate</Label>
                    <Input id="v_num" required value={manualForm.number_plate} onChange={e => setManualForm({...manualForm, number_plate: e.target.value})} placeholder="e.g. DL1ER 9999" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="v_mod">Model</Label>
                    <Input id="v_mod" required value={manualForm.model} onChange={e => setManualForm({...manualForm, model: e.target.value})} placeholder="e.g. Mahindra Treo" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="g_id">Assign Hub Manager</Label>
                    <Select required value={manualForm.hubmanager_id} onValueChange={(val) => setManualForm({...manualForm, hubmanager_id: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Hub Manager">
                          {manualForm.hubmanager_id && HubManagers.find(g => g.id === manualForm.hubmanager_id)
                            ? HubManagers.find(g => g.id === manualForm.hubmanager_id).full_name
                            : "Select Hub Manager"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {HubManagers.map(g => (
                          <SelectItem key={g.id} value={g.id}>{g.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Vehicle"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="csv" className="space-y-4 pt-4">
                <div className="flex justify-between items-center bg-muted/50 p-3 rounded-md mb-4 border border-border">
                  <div className="text-sm">
                    <span className="font-semibold">Format required:</span>
                    <br/>
                    number_plate, model, hubmanager_id
                  </div>
                  <Button variant="outline" size="sm" onClick={() => downloadCSV(['number_plate', 'model', 'hubmanager_id'], 'vehicle_import_template.csv')}>
                    <FileDown className="w-4 h-4 mr-2" /> Template
                  </Button>
                </div>
                <Label htmlFor="csv-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-background hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isSubmitting ? (
                      <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mb-2" />
                    ) : (
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    )}
                    <p className="text-sm text-muted-foreground font-semibold">Click to upload CSV</p>
                  </div>
                  <Input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} disabled={isSubmitting} />
                </Label>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicle, driver..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9 bg-background border-border"
              />
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-background border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="alloted">Alloted</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger className="w-[160px] bg-background border-border">
                  <SelectValue placeholder="Parking Area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Areas</SelectItem>
                  <SelectItem value="Okhla Phase 1">Okhla Phase 1</SelectItem>
                  <SelectItem value="Okhla Phase 2">Okhla Phase 2</SelectItem>
                  <SelectItem value="Lajpat Nagar">Lajpat Nagar</SelectItem>
                  <SelectItem value="Nehru Place">Nehru Place</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 relative min-h-[200px]">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted border-b border-border">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 font-medium">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          )}
          <div className="flex items-center justify-end space-x-2 p-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="border-border"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="border-border"
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
