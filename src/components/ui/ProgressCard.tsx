import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface ProgressCardProps {
  title: string;
  value: number;
  subtitle: string;
  type: 'current' | 'calculated' | 'status' | 'roadmap';
  statusInfo?: {
    shouldUpdate: boolean;
    current: string;
    suggested: string;
    reason: string;
  };
  roadmapInfo?: {
    totalItems: number;
    completedItems: number;
    inProgressItems: number;
    notStartedItems: number;
  };
}

export function ProgressCard({ title, value, subtitle, type, statusInfo, roadmapInfo }: ProgressCardProps) {
  const getCardStyle = () => {
    switch (type) {
      case 'current':
        return "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 hover:shadow-lg transition-all duration-300";
      case 'calculated':
        return "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300";
      case 'status':
        return statusInfo?.shouldUpdate 
          ? "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300"
          : "bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300";
      case 'roadmap':
        return "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300";
      default:
        return "hover:shadow-lg transition-all duration-300";
    }
  };

  const getTitleColor = () => {
    switch (type) {
      case 'current':
        return "text-slate-700";
      case 'calculated':
        return "text-blue-700";
      case 'status':
        return statusInfo?.shouldUpdate ? "text-orange-700" : "text-green-700";
      case 'roadmap':
        return "text-purple-700";
      default:
        return "text-gray-700";
    }
  };

  const getValueColor = () => {
    switch (type) {
      case 'current':
        return "text-slate-900";
      case 'calculated':
        return "text-blue-900";
      case 'status':
        return statusInfo?.shouldUpdate ? "text-orange-900" : "text-green-900";
      case 'roadmap':
        return "text-purple-900";
      default:
        return "text-gray-900";
    }
  };

  const getProgressBarColor = () => {
    switch (type) {
      case 'current':
        return { bg: "bg-slate-200", fill: "bg-slate-600" };
      case 'calculated':
        return { bg: "bg-blue-200", fill: "bg-blue-600" };
      default:
        return { bg: "bg-gray-200", fill: "bg-gray-600" };
    }
  };

  const renderStatusContent = () => {
    if (type !== 'status' || !statusInfo) return null;

    return (
      <>
        <div className={`text-2xl font-bold mb-1 ${getValueColor()}`}>
          {statusInfo.suggested}
        </div>
        {statusInfo.shouldUpdate ? (
          <>
            <Badge variant="outline" className="text-xs mb-2 border-orange-300 text-orange-700">
              {statusInfo.current} → {statusInfo.suggested}
            </Badge>
            <div className="text-xs text-orange-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {statusInfo.reason}
            </div>
          </>
        ) : (
          <>
            <Badge variant="secondary" className="text-xs mb-2 bg-green-100 text-green-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              Status adequado
            </Badge>
            <div className="text-xs text-green-600">
              Não necessita mudanças
            </div>
          </>
        )}
      </>
    );
  };

  const renderRoadmapContent = () => {
    if (type !== 'roadmap' || !roadmapInfo) return null;

    return (
      <>
        <div className="text-center mb-3">
          <div className={`text-2xl font-bold ${getValueColor()}`}>
            {roadmapInfo.totalItems}
          </div>
          <div className="text-xs text-purple-600">Total de itens</div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs">Concluídos</span>
            </div>
            <span className="text-sm font-bold text-green-600">
              {roadmapInfo.completedItems}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-xs">Em andamento</span>
            </div>
            <span className="text-sm font-bold text-yellow-600">
              {roadmapInfo.inProgressItems}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-xs">Não iniciados</span>
            </div>
            <span className="text-sm font-bold text-gray-500">
              {roadmapInfo.notStartedItems}
            </span>
          </div>
        </div>
      </>
    );
  };

  const renderDefaultContent = () => {
    if (type === 'status' || type === 'roadmap') return null;

    const { bg, fill } = getProgressBarColor();

    return (
      <>
        <div className={`text-3xl font-bold ${getValueColor()}`}>
          {value}%
        </div>
        <div className={`text-xs ${type === 'current' ? 'text-slate-500' : 'text-blue-600'}`}>
          {subtitle}
        </div>
        <div className={`w-full ${bg} rounded-full h-2 mt-2`}>
          <div 
            className={`${fill} h-2 rounded-full transition-all duration-700 ease-out`}
            style={{ width: `${value}%` }}
          />
        </div>
      </>
    );
  };

  return (
    <Card className={getCardStyle()}>
      <CardHeader className="pb-3">
        <CardTitle className={`text-sm font-medium ${getTitleColor()} flex items-center gap-2`}>
          {type === 'calculated' && <TrendingUp className="w-4 h-4" />}
          {type === 'status' && (statusInfo?.shouldUpdate ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />)}
          {type === 'roadmap' && <Clock className="w-4 h-4" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {renderStatusContent()}
        {renderRoadmapContent()}
        {renderDefaultContent()}
      </CardContent>
    </Card>
  );
}