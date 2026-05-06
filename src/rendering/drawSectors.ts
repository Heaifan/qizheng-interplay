export interface ThreatZone {
  unitId: string;
  x: number; y: number;
  angle: number;
  fireRadius: number; fireHalfAngleRad: number;
  visionRadius: number; visionHalfAngleRad: number;
  color: string;
}

export function drawThreatZones(
  ctx: CanvasRenderingContext2D,
  zones: ReadonlyArray<ThreatZone>,
): void {
  for (const zone of zones) {
    const vStart = zone.angle - zone.visionHalfAngleRad;
    const vEnd = zone.angle + zone.visionHalfAngleRad;
    ctx.beginPath();
    ctx.moveTo(zone.x, zone.y);
    ctx.arc(zone.x, zone.y, zone.visionRadius, vStart, vEnd);
    ctx.closePath();
    ctx.fillStyle = zone.color;
    ctx.globalAlpha = 0.07;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(zone.x, zone.y);
    ctx.arc(zone.x, zone.y, zone.visionRadius, vStart, vEnd);
    ctx.closePath();
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 6]);
    ctx.stroke();

    const fStart = zone.angle - zone.fireHalfAngleRad;
    const fEnd = zone.angle + zone.fireHalfAngleRad;
    ctx.beginPath();
    ctx.moveTo(zone.x, zone.y);
    ctx.arc(zone.x, zone.y, zone.fireRadius, fStart, fEnd);
    ctx.closePath();
    ctx.fillStyle = zone.color;
    ctx.globalAlpha = 0.15;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(zone.x, zone.y);
    ctx.arc(zone.x, zone.y, zone.fireRadius, fStart, fEnd);
    ctx.closePath();
    ctx.globalAlpha = 0.26;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
}
