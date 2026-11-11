import { CostAvailable } from '@/components/ReportCost';
import { useMemo, useState } from 'react';
import { divIcon } from 'leaflet';
import { CircleMarker, Marker, Popup, useMap, useMapEvent } from 'react-leaflet';
import { Link } from 'react-router-dom';
import Supercluster, { type PointFeature } from 'supercluster';
import { KATEGORI_LABEL, STATUS_LABEL, STATUS_MAP_COLOR, type MapPoint } from '@/types';

const markerColors = { merah: '#dc2626', oranye: '#d97706', kuning: '#facc15', hijau: '#008358', lain: '#64748b' };

function ReportMarker({ report, position }: { report: MapPoint; position: [number, number] }) {
  const isRed = report.status === 'diterima';
  return <>
    {isRed && <CircleMarker center={position} radius={18} interactive={false} pathOptions={{
      color: '#ef4444', weight: 1.5, fillColor: '#dc2626', fillOpacity: 0.25, className: 'marker-pulse-halo',
    }} />}
    <CircleMarker center={position} radius={isRed ? 10 : 8} pathOptions={{
      color: 'white', weight: 2, fillColor: markerColors[STATUS_MAP_COLOR[report.status]],
      fillOpacity: 0.95, className: isRed ? 'marker-pulse-red' : '',
    }}>
      <Popup>
        <div className="p-1 min-w-[200px]">
          <span className="mono text-[10px] text-slate-400">{report.kodeTiket}</span>
          <h3 className="font-bold text-sm text-civix-forest mt-0.5">{report.judul}</h3>
          {report.namaJalan && <p className="text-xs text-slate-600 mt-1 flex items-start gap-1">
            <span className="font-semibold text-civix-forest">Lokasi:</span> {report.namaJalan}
          </p>}
          <p className="text-xs text-civix-primary mt-1 font-medium">{KATEGORI_LABEL[report.kategori]}</p>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">{STATUS_LABEL[report.status]}</p>
          <CostAvailable report={report} />
          {report.status === 'selesai' && report.cost && <Link to={`/reports/${report.id}#biaya-penanganan`} className="block text-xs mt-2">Lihat rincian biaya →</Link>}
          <Link to={`/reports/${report.id}`} className="mt-3 block rounded-lg bg-civix-primary px-3 py-1.5 text-center text-xs font-semibold !text-white transition hover:bg-civix-deep">
            Buka Laporan
          </Link>
        </div>
      </Popup>
    </CircleMarker>
  </>;
}

export default function PublicReportMarkers({ points }: { points: MapPoint[] }) {
  const map = useMap();
  const maxZoom = map.getMaxZoom();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvent('zoomend', () => setZoom(map.getZoom()));

  const index = useMemo(() => {
    const features: PointFeature<MapPoint>[] = [];
    for (const report of points) {
      const longitude = Number(report.longitude);
      const latitude = Number(report.latitude);
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) continue;
      features.push({
        type: 'Feature', geometry: { type: 'Point', coordinates: [longitude, latitude] }, properties: report,
      });
    }
    // Match Leaflet's 256-pixel tiles so the radius uses the same scale.
    return new Supercluster<MapPoint>({ radius: 44, extent: 256, maxZoom }).load(features);
  }, [points, maxZoom]);

  return <>{index.getClusters([-180, -85, 180, 85], zoom).map(({ geometry, properties }) => {
    const [longitude, latitude] = geometry.coordinates;
    const position: [number, number] = [latitude, longitude];
    if (!('cluster' in properties)) {
      return <ReportMarker key={properties.id} report={properties} position={position} />;
    }

    const { cluster_id: clusterId, point_count: count } = properties;
    const expansionZoom = index.getClusterExpansionZoom(clusterId);
    const canExpand = expansionZoom <= maxZoom;
    const label = canExpand ? `Perbesar area dengan ${count} laporan` : `Lihat ${count} laporan di titik ini`;
    const icon = divIcon({ className: 'public-map-cluster', html: String(count), iconSize: [38, 38] });

    return <Marker key={`cluster-${clusterId}`} position={position} icon={icon} title={label}
      eventHandlers={{
        add: event => event.target.getElement()?.setAttribute('aria-label', label),
        click: () => { if (canExpand) map.setView(position, expansionZoom); },
      }}>
      {!canExpand && <Popup maxWidth={250} autoPanPaddingTopLeft={[12, 75]}>
        <div className="public-map-cluster-popup">
          <h3>{count} laporan berdekatan</h3>
          <ul>{index.getLeaves(clusterId, count).map(({ properties: report }) => <li key={report.id}>
            <Link to={`/reports/${report.id}`}>
              <strong>{report.judul}</strong>
              <span>{KATEGORI_LABEL[report.kategori]} · {STATUS_LABEL[report.status]}</span>
            </Link>
          </li>)}</ul>
        </div>
      </Popup>}
    </Marker>;
  })}</>;
}
