import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Check if it's an API request
  if (req.url.includes('/api/')) {
    // Clone request to include credentials (cookies)
    const authReq = req.clone({
      withCredentials: true
    });
    return next(authReq);
  }
  return next(req);
};
