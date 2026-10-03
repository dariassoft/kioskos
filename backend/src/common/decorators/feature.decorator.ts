import { SetMetadata } from '@nestjs/common';
import { FeatureKey } from '../../billing/feature-catalog';

export const FEATURE_METADATA_KEY = 'required_feature';
export const RequiresFeature = (feature: FeatureKey) => SetMetadata(FEATURE_METADATA_KEY, feature);