import * as yup from 'yup';

export const mapboxDirectionsSchema = yup.object({
  originLat: yup.number().required('originLat is required').min(-90).max(90),
  originLng: yup.number().required('originLng is required').min(-180).max(180),
  destLat:   yup.number().required('destLat is required').min(-90).max(90),
  destLng:   yup.number().required('destLng is required').min(-180).max(180),
});
