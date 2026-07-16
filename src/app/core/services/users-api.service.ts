import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/v1/users';

  public getUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  public updateUserRole(id: string, role: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/role`, { role });
  }

  public deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
