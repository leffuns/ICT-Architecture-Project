import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { FacilityListComponent } from './components/facility-list/facility-list.component';
import { FacilityDetailComponent } from './components/facility-detail/facility-detail.component';
import { BookingComponent } from './components/booking/booking.component';
import { PaymentComponent } from './components/payment/payment.component';
import { ConfirmationComponent } from './components/confirmation/confirmation.component';
import { ClubDashboardComponent } from './components/club-dashboard/club-dashboard.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'facilities', component: FacilityListComponent },
  { path: 'facilities/:id', component: FacilityDetailComponent },
  { path: 'book/:facilityId', component: BookingComponent },
  { path: 'payment/:id', component: PaymentComponent },
  { path: 'confirmation/:id', component: ConfirmationComponent },
  { path: 'club', component: ClubDashboardComponent },
  { path: '**', redirectTo: '' }
];