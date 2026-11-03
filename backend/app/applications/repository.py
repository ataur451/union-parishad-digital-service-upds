from app.database import supabase

class ApplicationRepository:
    @staticmethod
    def insert(data: dict):
        return supabase.table("service_applications").insert(data).execute()

    @staticmethod
    def get_all():
        return supabase.table("service_applications").select("*").order("created_at", desc=True).execute()

    @staticmethod
    def get_by_id(app_id: str):
        return supabase.table("service_applications").select("*").eq("id", app_id).execute()

    @staticmethod
    def update(app_id: str, data: dict):
        return supabase.table("service_applications").update(data).eq("id", app_id).execute()

    @staticmethod
    def delete(app_id: str):
        return supabase.table("service_applications").delete().eq("id", app_id).execute()