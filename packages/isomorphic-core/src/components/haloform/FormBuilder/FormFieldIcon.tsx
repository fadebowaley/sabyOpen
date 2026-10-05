"use client";
import React from "react";
import {
  FileText,
  Square,
  Radio,
  ListChecks,
  Calendar,
  Upload,
  Plus,
  Hash,
  Mail,
  Lock,
  ToggleLeft,
  Sliders,
  Clock,
  Eye,
  ArrowRight,
  ArrowLeft,
  Database,
  Star,
  List,
  Search,
  ShieldCheck,
  Edit3,
  Map,
  Heading,
  Type,
  UserRound,
  SendHorizontal,
} from "lucide-react";
import { ElementType } from "@haloform/types/form-builder";

interface FormFieldIconProps {
  type: ElementType;
  size?: number;
  buttonType?: string;
}

export const FormFieldIcon = ({
  type,
  size = 18,
  buttonType,
}: FormFieldIconProps) => {
  if (type === "button" && buttonType) {
    switch (buttonType) {
      case "next":
        return <ArrowRight size={size} />;
      case "back":
        return <ArrowLeft size={size} />;
      case "submit":
        return <Plus size={size} />;
      case "reset":
        return <Plus size={size} />;
      default:
        return <Plus size={size} />;
    }
  }

  switch (type) {
    case "text":
      return <FileText size={size} />;
    case "textarea":
      return <FileText size={size} />;
    case "number":
      return <Hash size={size} />;
    case "email":
      return <Mail size={size} />;
    case "password":
      return <Lock size={size} />;
    case "checkbox":
      return <Square size={size} />;
    case "radio":
      return <Radio size={size} />;
    case "dropdown":
      return <ListChecks size={size} />;
    case "apidropdown":
      return <Database size={size} />;
    case "datepicker":
      return <Calendar size={size} />;
    case "timepicker":
      return <Clock size={size} />;
    case "fileupload":
      return <Upload size={size} />;
    case "toggle":
      return <ToggleLeft size={size} />;
    case "slider":
      return <Sliders size={size} />;
    case "hidden":
      return <Eye size={size} />;
    case "button":
      return <Plus size={size} />;
    case "rating":
      return <Star size={size} />;
    case "dependentDropdown":
      return <List size={size} />;
    case "searchLookup":
      return <Search size={size} />;
    case "sessionLookup":
      return <UserRound size={size} />;
    case "endpointSubmission":
      return <SendHorizontal size={size} />;
    case "captcha":
      return <ShieldCheck size={size} />;
    case "signature":
      return <Edit3 size={size} />;
    case "locationPicker":
      return <Map size={size} />;
    case "header":
      return <Heading size={size} />;
    case "paragraph":
      return <Type size={size} />;
    default:
      return <FileText size={size} />;
  }
};
