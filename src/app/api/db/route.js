import { connectDB } from "@/app/db/connection";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const response = await connectDB();
        
        if (response.status === 200) {
            return NextResponse.json({
                success: true,
                message: response.msg
            });
        } else {
            return NextResponse.json({
                success: false,
                error: response.message || "Failed to connect to database"
            }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: "Internal Server Error"
        }, { status: 500 });
    }
}