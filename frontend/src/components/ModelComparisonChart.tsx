import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ModelResult {
    probs: {
        benign: number;
        malignant: number;
        normal: number;
    };
    top_class: string;
    confidence: number;
}

interface ModelComparisonChartProps {
    models: Record<string, ModelResult>;
}

const ModelComparisonChart: React.FC<ModelComparisonChartProps> = ({ models }) => {
    // Transform data for Recharts
    const chartData = models ? Object.entries(models)
        .filter(([_, result]) => result && result.probs)
        .map(([modelName, result]) => ({
            model: modelName.toUpperCase(),
            Benign: (result.probs.benign * 100).toFixed(2),
            Malignant: (result.probs.malignant * 100).toFixed(2),
            Normal: (result.probs.normal * 100).toFixed(2),
        })) : [];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'rgba(17, 24, 39, 0.95)',
                    backdropFilter: 'blur(12px)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: 'white' }}>{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ margin: '0.25rem 0', color: entry.color, fontSize: '0.875rem' }}>
                            {entry.name}: {entry.value}%
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={400}>
            <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                <XAxis
                    dataKey="model"
                    stroke="rgba(255, 255, 255, 0.7)"
                    tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                />
                <YAxis
                    stroke="rgba(255, 255, 255, 0.7)"
                    tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                    label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft', fill: 'rgba(255, 255, 255, 0.7)' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    wrapperStyle={{ color: 'rgba(255, 255, 255, 0.9)' }}
                    iconType="circle"
                />
                <Bar
                    dataKey="Benign"
                    fill="hsl(142, 71%, 45%)"
                    radius={[8, 8, 0, 0]}
                />
                <Bar
                    dataKey="Malignant"
                    fill="hsl(0, 84%, 60%)"
                    radius={[8, 8, 0, 0]}
                />
                <Bar
                    dataKey="Normal"
                    fill="hsl(199, 89%, 48%)"
                    radius={[8, 8, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default ModelComparisonChart;
