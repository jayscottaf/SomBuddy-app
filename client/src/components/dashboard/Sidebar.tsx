import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r h-screen sticky top-0">
      <div className="p-6">
        <h2 className="text-xl font-heading font-bold text-gray-900">Layover Fuel</h2>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <Link href="/dashboard">
          <a className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
            location === "/dashboard" 
              ? "bg-primary-50 text-primary-700" 
              : "text-gray-700 hover:bg-gray-100"
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Dashboard</span>
          </a>
        </Link>
        
        <Link href="/dashboard/plan">
          <a className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
            location === "/dashboard/plan" 
              ? "bg-primary-50 text-primary-700" 
              : "text-gray-700 hover:bg-gray-100"
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span>Daily Plan</span>
          </a>
        </Link>
        
        <Link href="/dashboard/nutrition">
          <a className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
            location === "/dashboard/nutrition" 
              ? "bg-primary-50 text-primary-700" 
              : "text-gray-700 hover:bg-gray-100"
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <span>Nutrition</span>
          </a>
        </Link>
        
        <Link href="/dashboard/workout">
          <a className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
            location === "/dashboard/workout" 
              ? "bg-primary-50 text-primary-700" 
              : "text-gray-700 hover:bg-gray-100"
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>Workouts</span>
          </a>
        </Link>
        
        <Link href="/dashboard/profile">
          <a className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
            location === "/dashboard/profile" 
              ? "bg-primary-50 text-primary-700" 
              : "text-gray-700 hover:bg-gray-100"
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Profile</span>
          </a>
        </Link>
        
        <Link href="/dashboard/settings">
          <a className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
            location === "/dashboard/settings" 
              ? "bg-primary-50 text-primary-700" 
              : "text-gray-700 hover:bg-gray-100"
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Settings</span>
          </a>
        </Link>
      </nav>
    </div>
  );
}
