"""
Test booking flow: creates test bookings to verify:
1. Price calculation works correctly (not defaulting to 25km)
2. Admin receives confirmation email at info@bookaride.co.nz
3. Google Calendar event is created automatically
4. Return trip details are included in confirmations
"""
import requests
import json
import time
from datetime import datetime, timedelta

API = "https://bookaride-backend.onrender.com/api"

def test_calculate_price():
    """Test price calculation to see if 25km fallback bug exists"""
    print("\n" + "="*60)
    print("TEST 1: Price Calculation (checking 25km bug)")
    print("="*60)
    
    # Test with a known long route: Orewa to Auckland Airport (~73km)
    payload = {
        "serviceType": "airport-shuttle",
        "pickupAddress": "Orewa, Auckland, New Zealand",
        "pickupAddresses": [],
        "dropoffAddress": "Auckland Airport, Ray Emery Drive, Mangere, Auckland 2022, New Zealand",
        "passengers": 2,
        "vipAirportPickup": False,
        "oversizedLuggage": False
    }
    
    print(f"\nRoute: Orewa -> Auckland Airport (expected ~73km)")
    resp = requests.post(f"{API}/calculate-price", json=payload, timeout=30)
    print(f"Status: {resp.status_code}")
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"  Distance: {data.get('distance')} km")
        print(f"  Base Price: ${data.get('basePrice', 0):.2f}")
        print(f"  Airport Fee: ${data.get('airportFee', 0):.2f}")
        print(f"  Passenger Fee: ${data.get('passengerFee', 0):.2f}")
        print(f"  Subtotal: ${data.get('subtotal', 0):.2f}")
        print(f"  Total Price: ${data.get('totalPrice', 0):.2f}")
        
        distance = data.get('distance', 0)
        if distance < 30:
            print(f"\n  *** WARNING: Distance is {distance}km - likely hitting 25km fallback bug! ***")
            print(f"  *** This will be fixed once the feature branch is merged to main ***")
        else:
            print(f"\n  Distance looks correct ({distance}km)")
        
        return data
    else:
        print(f"Error: {resp.text}")
        return None


def test_calculate_price_short():
    """Test price calculation for a shorter known route"""
    print("\n" + "="*60)
    print("TEST 2: Price Calculation (short route)")
    print("="*60)
    
    # Test with Auckland CBD to Airport (~22km)
    payload = {
        "serviceType": "airport-shuttle",
        "pickupAddress": "1 Queen Street, Auckland CBD, Auckland, New Zealand",
        "pickupAddresses": [],
        "dropoffAddress": "Auckland Airport, Ray Emery Drive, Mangere, Auckland 2022, New Zealand",
        "passengers": 1,
        "vipAirportPickup": False,
        "oversizedLuggage": False
    }
    
    print(f"\nRoute: Auckland CBD -> Auckland Airport (expected ~22km)")
    resp = requests.post(f"{API}/calculate-price", json=payload, timeout=30)
    print(f"Status: {resp.status_code}")
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"  Distance: {data.get('distance')} km")
        print(f"  Total Price: ${data.get('totalPrice', 0):.2f}")
        return data
    else:
        print(f"Error: {resp.text}")
        return None


def create_test_booking_oneway(pricing_data):
    """Create a one-way test booking"""
    print("\n" + "="*60)
    print("TEST 3: Create One-Way Test Booking")
    print("="*60)
    
    # Use a date 3 days from now to avoid 24-hour approval requirement
    future_date = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
    
    booking_data = {
        "serviceType": "airport-shuttle",
        "pickupAddress": "1 Queen Street, Auckland CBD, Auckland, New Zealand",
        "pickupAddresses": [],
        "dropoffAddress": "Auckland Airport, Ray Emery Drive, Mangere, Auckland 2022, New Zealand",
        "date": future_date,
        "time": "08:00",
        "passengers": "1",
        "departureFlightNumber": "NZ-TEST-101",
        "departureTime": "10:30",
        "arrivalFlightNumber": "",
        "arrivalTime": "",
        "name": "TEST BOOKING - Delete Me",
        "email": "info@bookaride.co.nz",
        "phone": "+64211234567",
        "notes": "*** THIS IS A TEST BOOKING - PLEASE DELETE ***\nTesting email confirmations and calendar uploads.",
        "pricing": pricing_data or {"totalPrice": 0, "distance": 0, "basePrice": 0, "airportFee": 0, "oversizedLuggageFee": 0, "passengerFee": 0, "stripeFee": 0, "subtotal": 0},
        "status": "pending",
        "paymentMethod": "card",
        "vipAirportPickup": False,
        "oversizedLuggage": False,
        "bookReturn": False,
        "returnDate": "",
        "returnTime": "",
        "returnDepartureFlightNumber": "",
        "returnDepartureTime": "",
        "returnArrivalFlightNumber": "",
        "returnArrivalTime": "",
        "notificationPreference": "email",
        "language": "en"
    }
    
    print(f"\nBooking: {booking_data['name']}")
    print(f"  Route: Auckland CBD -> Auckland Airport")
    print(f"  Date: {future_date} at 08:00")
    print(f"  Flight: NZ-TEST-101 departing 10:30")
    print(f"  Email: {booking_data['email']}")
    print(f"  Notification: email only")
    
    resp = requests.post(f"{API}/bookings", json=booking_data, timeout=30)
    print(f"\nStatus: {resp.status_code}")
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"  Booking ID: {data.get('id')}")
        print(f"  Reference: #{data.get('referenceNumber')}")
        print(f"  Status: {data.get('status')}")
        print(f"\n  Admin should receive confirmation email at info@bookaride.co.nz")
        print(f"  Google Calendar event should be created automatically")
        return data
    else:
        print(f"Error: {resp.text[:500]}")
        return None


def create_test_booking_return(pricing_data):
    """Create a return trip test booking with all return details"""
    print("\n" + "="*60)
    print("TEST 4: Create Return Trip Test Booking")
    print("="*60)
    
    # Use dates 4-5 days from now
    outbound_date = (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d")
    return_date = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
    
    # Double the pricing for return trip
    return_pricing = {}
    if pricing_data:
        return_pricing = {
            "totalPrice": pricing_data.get("totalPrice", 0) * 2,
            "distance": pricing_data.get("distance", 0) * 2,
            "basePrice": pricing_data.get("basePrice", 0) * 2,
            "airportFee": pricing_data.get("airportFee", 0) * 2,
            "oversizedLuggageFee": 0,
            "passengerFee": pricing_data.get("passengerFee", 0) * 2,
            "stripeFee": pricing_data.get("stripeFee", 0) * 2,
            "subtotal": pricing_data.get("subtotal", 0) * 2
        }
    else:
        return_pricing = {"totalPrice": 0, "distance": 0, "basePrice": 0, "airportFee": 0, "oversizedLuggageFee": 0, "passengerFee": 0, "stripeFee": 0, "subtotal": 0}
    
    booking_data = {
        "serviceType": "airport-shuttle",
        "pickupAddress": "10 Hibiscus Coast Highway, Orewa, Auckland, New Zealand",
        "pickupAddresses": [],
        "dropoffAddress": "Auckland Airport, Ray Emery Drive, Mangere, Auckland 2022, New Zealand",
        "date": outbound_date,
        "time": "06:30",
        "passengers": "2",
        "departureFlightNumber": "NZ-TEST-202",
        "departureTime": "09:00",
        "arrivalFlightNumber": "",
        "arrivalTime": "",
        "name": "TEST RETURN - Delete Me",
        "email": "info@bookaride.co.nz",
        "phone": "+64219876543",
        "notes": "*** THIS IS A TEST RETURN BOOKING - PLEASE DELETE ***\nTesting return trip details in confirmations.\n2 passengers with luggage.",
        "pricing": return_pricing,
        "status": "pending",
        "paymentMethod": "card",
        "vipAirportPickup": True,
        "oversizedLuggage": True,
        "bookReturn": True,
        "returnDate": return_date,
        "returnTime": "18:00",
        "returnDepartureFlightNumber": "NZ-TEST-303",
        "returnDepartureTime": "15:30",
        "returnArrivalFlightNumber": "NZ-TEST-304",
        "returnArrivalTime": "17:45",
        "notificationPreference": "email",
        "language": "en"
    }
    
    print(f"\nBooking: {booking_data['name']}")
    print(f"  OUTBOUND: Orewa -> Auckland Airport")
    print(f"  Date: {outbound_date} at 06:30")
    print(f"  Flight: NZ-TEST-202 departing 09:00")
    print(f"  Passengers: 2, VIP Pickup: Yes, Oversized Luggage: Yes")
    print(f"  RETURN: Auckland Airport -> Orewa")
    print(f"  Return Date: {return_date} at 18:00")
    print(f"  Return Flight: NZ-TEST-303 departing 15:30")
    print(f"  Return Arrival: NZ-TEST-304 arriving 17:45")
    print(f"  Email: {booking_data['email']}")
    print(f"  Notes: Test notes included")
    
    resp = requests.post(f"{API}/bookings", json=booking_data, timeout=30)
    print(f"\nStatus: {resp.status_code}")
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"  Booking ID: {data.get('id')}")
        print(f"  Reference: #{data.get('referenceNumber')}")
        print(f"  Status: {data.get('status')}")
        print(f"\n  Admin should receive confirmation email at info@bookaride.co.nz")
        print(f"  Confirmation should include ALL return trip details:")
        print(f"    - Return date, time, flight numbers, departure/arrival times")
        print(f"    - Notes about 2 passengers with luggage")
        print(f"    - VIP Pickup and Oversized Luggage flags")
        print(f"  Google Calendar should have TWO events (outbound + return)")
        return data
    else:
        print(f"Error: {resp.text[:500]}")
        return None


def main():
    print("="*60)
    print("BOOK A RIDE - TEST BOOKING FLOW")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Backend: {API}")
    print("="*60)
    print("\nNOTE: Production backend is on 'main' branch.")
    print("Code fixes are on 'cursor/booking-form-and-confirmations-e05f'.")
    print("Price calculation fix will take effect after merge + deploy.\n")
    
    # Test 1: Price calculation
    pricing1 = test_calculate_price()
    time.sleep(1)
    
    # Test 2: Short route price
    pricing2 = test_calculate_price_short()
    time.sleep(1)
    
    # Test 3: One-way booking
    booking1 = create_test_booking_oneway(pricing2)
    time.sleep(2)
    
    # Test 4: Return trip booking
    booking2 = create_test_booking_return(pricing1)
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    if pricing1:
        dist1 = pricing1.get('distance', 0)
        bug = " *** 25KM BUG DETECTED ***" if dist1 < 30 else " (correct)"
        print(f"  Orewa -> Airport distance: {dist1}km{bug}")
    
    if pricing2:
        dist2 = pricing2.get('distance', 0)
        print(f"  CBD -> Airport distance: {dist2}km")
    
    if booking1:
        print(f"\n  One-way booking: #{booking1.get('referenceNumber')} - {booking1.get('status')}")
    else:
        print(f"\n  One-way booking: FAILED")
    
    if booking2:
        print(f"  Return booking:  #{booking2.get('referenceNumber')} - {booking2.get('status')}")
    else:
        print(f"  Return booking:  FAILED")
    
    print(f"\n  Check info@bookaride.co.nz for:")
    print(f"    1. Admin notification emails for both test bookings")
    print(f"    2. Customer confirmation emails (sent to same email)")
    print(f"    3. Google Calendar events (outbound + return for booking 2)")
    
    print(f"\n  Both bookings are marked as TEST with notes to delete them.")
    print(f"  You can delete them from the admin dashboard.\n")


if __name__ == "__main__":
    main()
