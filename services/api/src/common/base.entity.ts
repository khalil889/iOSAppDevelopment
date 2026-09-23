import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

/** GeoJSON point as stored in a PostGIS geography(Point, 4326) column. */
export interface GeoPoint {
  type: 'Point';
  /** [longitude, latitude] */
  coordinates: [number, number];
}

export const geoPoint = (lat: number, lng: number): GeoPoint => ({
  type: 'Point',
  coordinates: [lng, lat],
});
