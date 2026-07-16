"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardCharts } from "@/features/dashboard/queries";
import {
  DashboardChartPoint,
  DashboardChartsData,
  DashboardDistributionPoint,
  DashboardPeriod,
} from "@/features/dashboard/types";
import { cn } from "@/lib/utils";

type AttendancePoint = DashboardChartPoint;
type WorkloadPoint = DashboardChartPoint;
type DepartmentPoint = DashboardDistributionPoint;
type SalaryPoint = DashboardDistributionPoint;
type ChartFilter = DashboardPeriod;

const filterOptions: Array<{ key: ChartFilter; label: string }> = [
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
  { key: "overall", label: "Overall" },
];

interface D3ChartsProps {
  isLoading?: boolean;
}

function readCssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();

  return value || fallback;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function D3Charts({ isLoading = false }: D3ChartsProps) {
  const [activeFilter, setActiveFilter] = useState<ChartFilter>("monthly");
  const { data: chartData, isLoading: isChartLoading, error: queryError } = useDashboardCharts(activeFilter);
  const chartError = queryError ? (queryError as Error).message : null;
  const attendanceRef = useRef<SVGSVGElement | null>(null);
  const workloadRef = useRef<SVGSVGElement | null>(null);
  const departmentRef = useRef<SVGSVGElement | null>(null);
  const salaryRef = useRef<SVGSVGElement | null>(null);

  const attendanceData = useMemo(
    () => chartData?.attendanceTrend ?? [],
    [chartData],
  );

  const departmentData = useMemo(
    () => chartData?.departmentDistribution ?? [],
    [chartData],
  );

  const workloadData = useMemo(() => chartData?.workload ?? [], [chartData]);

  const salaryData = useMemo(
    () => chartData?.salaryDistribution ?? [],
    [chartData],
  );

  const totalSalary =
    chartData?.totalSalary ?? d3.sum(salaryData, (d) => d.value);
  const currency = chartData?.currency ?? "INR";
  const showLoading = isLoading || isChartLoading;

  useEffect(() => {
    if (!attendanceRef.current) {
      return;
    }

    const svg = d3.select(attendanceRef.current);
    svg.selectAll("*").remove();

    const width = 560;
    const height = 250;
    const margin = { top: 18, right: 18, bottom: 36, left: 42 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const axisText = readCssVar("--muted-foreground", "#64748b");
    const gridStroke = readCssVar("--border", "#e2e8f0");
    const lineColor = "#2563eb";
    const areaColor = "#93c5fd";

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scalePoint<string>()
      .domain(attendanceData.map((d) => d.label))
      .range([0, innerWidth]);

    const yMax = Math.max(d3.max(attendanceData, (d) => d.value) ?? 0, 1);

    const y = d3
      .scaleLinear()
      .domain([0, yMax + Math.max(2, Math.round(yMax * 0.15))])
      .nice()
      .range([innerHeight, 0]);

    const yGrid = d3
      .axisLeft(y)
      .ticks(4)
      .tickSize(-innerWidth)
      .tickFormat(() => "");

    chart
      .append("g")
      .attr("class", "grid")
      .call(yGrid)
      .call((g) =>
        g
          .selectAll(".tick line")
          .attr("stroke", gridStroke)
          .attr("opacity", 0.7),
      )
      .call((g) => g.select(".domain").remove());

    const area = d3
      .area<AttendancePoint>()
      .x((d) => x(d.label) ?? 0)
      .y0(innerHeight)
      .y1((d) => y(d.value))
      .curve(d3.curveCatmullRom.alpha(0.6));

    const line = d3
      .line<AttendancePoint>()
      .x((d) => x(d.label) ?? 0)
      .y((d) => y(d.value))
      .curve(d3.curveCatmullRom.alpha(0.6));

    chart
      .append("path")
      .datum(attendanceData)
      .attr("fill", areaColor)
      .attr("fill-opacity", 0)
      .attr("d", area)
      .transition()
      .duration(950)
      .ease(d3.easeCubicOut)
      .attr("fill-opacity", 0.28);

    const linePath = chart
      .append("path")
      .datum(attendanceData)
      .attr("fill", "none")
      .attr("stroke", lineColor)
      .attr("stroke-width", 2.5)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .attr("d", line);

    const totalLength = linePath.node()?.getTotalLength() ?? 0;
    linePath
      .attr("stroke-dasharray", totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(1050)
      .ease(d3.easeCubicInOut)
      .attr("stroke-dashoffset", 0);

    chart
      .selectAll("circle")
      .data(attendanceData)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.label) ?? 0)
      .attr("cy", (d) => y(d.value))
      .attr("r", 0)
      .attr("fill", lineColor)
      .transition()
      .delay((_, i) => i * 80 + 320)
      .duration(350)
      .ease(d3.easeBackOut)
      .attr("r", 4);

    chart
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .call((g) =>
        g.selectAll("text").attr("fill", axisText).style("font-size", "11px"),
      )
      .call((g) => g.selectAll(".tick line").attr("stroke", gridStroke))
      .call((g) => g.select(".domain").attr("stroke", gridStroke));

    chart
      .append("g")
      .call(d3.axisLeft(y).ticks(4))
      .call((g) =>
        g.selectAll("text").attr("fill", axisText).style("font-size", "11px"),
      )
      .call((g) => g.selectAll(".tick line").attr("stroke", gridStroke))
      .call((g) => g.select(".domain").attr("stroke", gridStroke));
  }, [attendanceData]);

  useEffect(() => {
    if (!workloadRef.current) {
      return;
    }

    const svg = d3.select(workloadRef.current);
    svg.selectAll("*").remove();

    const width = 560;
    const height = 250;
    const margin = { top: 20, right: 14, bottom: 42, left: 46 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const axisText = readCssVar("--muted-foreground", "#64748b");
    const gridStroke = readCssVar("--border", "#e2e8f0");

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand<string>()
      .domain(workloadData.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.35);

    const yMax = Math.max(d3.max(workloadData, (d) => d.value) ?? 0, 1);
    const y = d3
      .scaleLinear()
      .domain([0, yMax + Math.max(1, Math.round(yMax * 0.2))])
      .nice()
      .range([innerHeight, 0]);

    chart
      .append("g")
      .call(
        d3
          .axisLeft(y)
          .ticks(4)
          .tickSize(-innerWidth)
          .tickFormat(() => ""),
      )
      .call((g) =>
        g
          .selectAll(".tick line")
          .attr("stroke", gridStroke)
          .attr("opacity", 0.7),
      )
      .call((g) => g.select(".domain").remove());

    chart
      .selectAll("rect")
      .data(workloadData)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.label) ?? 0)
      .attr("width", x.bandwidth())
      .attr("y", innerHeight)
      .attr("height", 0)
      .attr("rx", 8)
      .attr("fill", "#0ea5e9")
      .transition()
      .delay((_, i) => i * 110)
      .duration(900)
      .ease(d3.easeCubicOut)
      .attr("y", (d) => y(d.value))
      .attr("height", (d) => innerHeight - y(d.value));

    chart
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .call((g) =>
        g.selectAll("text").attr("fill", axisText).style("font-size", "11px"),
      )
      .call((g) => g.selectAll(".tick line").attr("stroke", gridStroke))
      .call((g) => g.select(".domain").attr("stroke", gridStroke));

    chart
      .append("g")
      .call(d3.axisLeft(y).ticks(4))
      .call((g) =>
        g.selectAll("text").attr("fill", axisText).style("font-size", "11px"),
      )
      .call((g) => g.selectAll(".tick line").attr("stroke", gridStroke))
      .call((g) => g.select(".domain").attr("stroke", gridStroke));
  }, [workloadData]);

  useEffect(() => {
    if (!departmentRef.current) {
      return;
    }

    const svg = d3.select(departmentRef.current);
    svg.selectAll("*").remove();

    const width = 560;
    const height = 250;
    const radius = Math.min(width, height) * 0.3;
    const centerX = width * 0.36;
    const centerY = height * 0.52;
    const mutedText = readCssVar("--muted-foreground", "#64748b");

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const pie = d3
      .pie<DepartmentPoint>()
      .sort(null)
      .value((d) => d.value);

    const arc = d3
      .arc<d3.PieArcDatum<DepartmentPoint>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);

    const chart = svg.append("g");

    const arcGroups = chart
      .selectAll(".slice")
      .data(pie(departmentData))
      .enter()
      .append("g")
      .attr("class", "slice")
      .attr("transform", `translate(${centerX},${centerY}) scale(0.85)`)
      .attr("opacity", 0);

    arcGroups
      .append("path")
      .attr("d", (d) => arc(d) ?? "")
      .attr("fill", (d) => d.data.color)
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    arcGroups
      .transition()
      .delay((_, i) => i * 90)
      .duration(850)
      .ease(d3.easeCubicOut)
      .attr("opacity", 1)
      .attr("transform", `translate(${centerX},${centerY}) scale(1)`);

    const total = d3.sum(departmentData, (d) => d.value);

    chart
      .append("text")
      .attr("x", centerX)
      .attr("y", centerY - 6)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", mutedText)
      .text("Employees");

    chart
      .append("text")
      .attr("x", centerX)
      .attr("y", centerY + 18)
      .attr("text-anchor", "middle")
      .style("font-size", "24px")
      .style("font-weight", "700")
      .text(total.toString());

    const legend = svg
      .append("g")
      .attr("transform", `translate(${width * 0.62}, ${height * 0.24})`);

    const row = legend
      .selectAll("g")
      .data(departmentData)
      .enter()
      .append("g")
      .attr("transform", (_, i) => `translate(0, ${i * 30})`)
      .attr("opacity", 0);

    row
      .append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("rx", 3)
      .attr("fill", (d) => d.color);

    row
      .append("text")
      .attr("x", 20)
      .attr("y", 10)
      .style("font-size", "12px")
      .style("fill", mutedText)
      .text((d) => `${d.label}: ${d.value}`);

    row
      .transition()
      .delay((_, i) => 200 + i * 80)
      .duration(500)
      .attr("opacity", 1);
  }, [departmentData]);

  useEffect(() => {
    if (!salaryRef.current) {
      return;
    }

    const svg = d3.select(salaryRef.current);
    svg.selectAll("*").remove();

    const width = 560;
    const height = 250;
    const radius = Math.min(width, height) * 0.26;
    const centerX = width * 0.3;
    const centerY = height * 0.52;
    const mutedText = readCssVar("--muted-foreground", "#64748b");

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const pie = d3
      .pie<SalaryPoint>()
      .sort(null)
      .value((d) => d.value);

    const arc = d3
      .arc<d3.PieArcDatum<SalaryPoint>>()
      .innerRadius(0)
      .outerRadius(radius);

    const chart = svg.append("g");

    const arcGroups = chart
      .selectAll(".salary-slice")
      .data(pie(salaryData))
      .enter()
      .append("g")
      .attr("class", "salary-slice")
      .attr("transform", `translate(${centerX},${centerY}) scale(0.82)`)
      .attr("opacity", 0);

    arcGroups
      .append("path")
      .attr("d", (d) => arc(d) ?? "")
      .attr("fill", (d) => d.data.color)
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    arcGroups
      .transition()
      .delay((_, i) => i * 90)
      .duration(820)
      .ease(d3.easeCubicOut)
      .attr("opacity", 1)
      .attr("transform", `translate(${centerX},${centerY}) scale(1)`);

    const legend = svg
      .append("g")
      .attr("transform", `translate(${width * 0.54}, ${height * 0.19})`);

    const row = legend
      .selectAll("g")
      .data(salaryData)
      .enter()
      .append("g")
      .attr("transform", (_, i) => `translate(0, ${i * 34})`)
      .attr("opacity", 0);

    row
      .append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("rx", 3)
      .attr("fill", (d) => d.color);

    row
      .append("text")
      .attr("x", 20)
      .attr("y", 10)
      .style("font-size", "12px")
      .style("fill", mutedText)
      .text((d) => `${d.label}: ${formatCurrency(d.value, currency)}`);

    row
      .transition()
      .delay((_, i) => 170 + i * 80)
      .duration(500)
      .attr("opacity", 1);
  }, [currency, salaryData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Analytics Overview
          </h3>
          <p className="text-sm text-muted-foreground">
            Toggle timeframe to compare trends across monthly, yearly, and
            overall views.
          </p>
        </div>
        <div className="inline-flex items-center rounded-lg border border-border bg-muted/50 p-1">
          {filterOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setActiveFilter(option.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition",
                activeFilter === option.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {chartError ? <p className="text-sm text-red-600">{chartError}</p> : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {showLoading ? (
              <p className="text-sm text-muted-foreground">
                Rendering chart...
              </p>
            ) : (
              <svg ref={attendanceRef} className="h-64 w-full" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Workload Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {showLoading ? (
              <p className="text-sm text-muted-foreground">
                Rendering chart...
              </p>
            ) : (
              <svg ref={workloadRef} className="h-64 w-full" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {showLoading ? (
              <p className="text-sm text-muted-foreground">
                Rendering chart...
              </p>
            ) : (
              <svg ref={departmentRef} className="h-64 w-full" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Salary Paid</CardTitle>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalSalary, currency)} across {activeFilter}{" "}
              range
            </p>
          </CardHeader>
          <CardContent>
            {showLoading ? (
              <p className="text-sm text-muted-foreground">
                Rendering chart...
              </p>
            ) : (
              <svg ref={salaryRef} className="h-64 w-full" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
